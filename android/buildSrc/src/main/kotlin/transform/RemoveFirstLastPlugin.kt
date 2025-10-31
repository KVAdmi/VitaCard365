package transform

import javax.inject.Inject
import org.gradle.api.model.ObjectFactory

import com.android.build.api.instrumentation.*
import com.android.build.api.variant.AndroidComponentsExtension
import org.gradle.api.Plugin
import org.gradle.api.Project
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes

/**
 * Plugin de Gradle para registrar la instrumentación de bytecode.
 */

class RemoveFirstLastPlugin : Plugin<Project> {
    override fun apply(project: Project) {
        val androidComponents = project.extensions.findByType(AndroidComponentsExtension::class.java)
            ?: return
        androidComponents.onVariants { variant ->
            variant.transformClassesWith(
                RemoveFirstLastInstrumentationFactory::class.java,
                InstrumentationScope.ALL
            ) { /* no params */ }
        }
    }
}
abstract class RemoveFirstLastInstrumentationFactory : AsmClassVisitorFactory<RemoveFirstLastParams> {
    abstract override val parameters: org.gradle.api.provider.Property<RemoveFirstLastParams>

    override fun createClassVisitor(
        classContext: ClassContext,
        nextClassVisitor: ClassVisitor
    ): ClassVisitor {
        val apiVersion = instrumentationContext.apiVersion.get()
        return RemoveFirstLastClassVisitor(apiVersion, nextClassVisitor)
    }

    override fun isInstrumentable(classData: ClassData): Boolean = true
}

interface RemoveFirstLastParams : InstrumentationParameters {
    // Si necesitaras pasar valores del build.gradle al factory, irían aquí.
}

/**
 * ClassVisitor que delega a un MethodVisitor para buscar las llamadas.
 */
class RemoveFirstLastClassVisitor(
    api: Int,
    classVisitor: ClassVisitor
) : ClassVisitor(api, classVisitor) {

    override fun visitMethod(
        access: Int,
        name: String?,
        descriptor: String?,
        signature: String?,
        exceptions: Array<out String>?
    ): MethodVisitor? {
        val mv = super.visitMethod(access, name, descriptor, signature, exceptions)
        return if (mv != null) {
            RemoveFirstLastMethodVisitor(api, mv)
        } else {
            null
        }
    }
}

/**
 * MethodVisitor que intercepta y reemplaza las llamadas.
 */
class RemoveFirstLastMethodVisitor(
    api: Int,
    methodVisitor: MethodVisitor
) : MethodVisitor(api, methodVisitor) {

    override fun visitMethodInsn(
        opcode: Int,
        owner: String,
        name: String,
        descriptor: String,
        isInterface: Boolean
    ) {

        val safeOwner = "com/vitacard365/SafeCollectionsKt"
        val retObj = ")Ljava/lang/Object;"
        val listOwner = "java/util/List"
        val dequeOwner = "java/util/Deque"
        val isListOrDeque = owner == listOwner || owner == dequeOwner
        val isRemoveFirstLast = (name == "removeFirst" || name == "removeLast")
        val sigMatches = descriptor == "()" + retObj // "()Ljava/lang/Object;"

        // Intercepta llamadas a List/Deque#removeFirst/Last()
        if (opcode == Opcodes.INVOKEINTERFACE && isInterface && isListOrDeque && isRemoveFirstLast && sigMatches) {
            val newName = when (name) {
                "removeFirst" -> "safeRemoveFirst"
                "removeLast"  -> "safeRemoveLast"
                else -> name
            }
            super.visitMethodInsn(
                Opcodes.INVOKESTATIC,
                safeOwner,
                newName,
                "(Ljava/util/List;)"+retObj,
                false
            )
            println("ASM FIX: Redirigida llamada a $owner.$name a $safeOwner.$newName (List/Deque)")
            return
        }

        // Intercepta llamadas a las extensiones de Kotlin
        val isKotlinOwner = owner.startsWith("kotlin/collections/")
        if (opcode == Opcodes.INVOKESTATIC && isKotlinOwner && isRemoveFirstLast && descriptor == "(Ljava/util/List;)"+retObj) {
            val newName = when (name) {
                "removeFirst" -> "safeRemoveFirst"
                "removeLast"  -> "safeRemoveLast"
                else -> name
            }
            super.visitMethodInsn(Opcodes.INVOKESTATIC, safeOwner, newName, "(Ljava/util/List;)"+retObj, false)
            println("ASM FIX: Redirigida llamada a $owner.$name a $safeOwner.$newName (Kotlin ext)")
            return
        }

        // Si no es la función que buscamos, simplemente delegar la llamada original
        super.visitMethodInsn(opcode, owner, name, descriptor, isInterface)
    }
}
