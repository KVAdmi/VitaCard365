
package transform

import com.android.build.api.instrumentation.*
import org.objectweb.asm.ClassVisitor
import org.objectweb.asm.MethodVisitor
import org.objectweb.asm.Opcodes
import org.objectweb.asm.commons.AdviceAdapter

class RemoveFirstLastInstrumentation(cv: ClassVisitor) : ClassVisitor(Opcodes.ASM9, cv) {
    override fun visitMethod(
        access: Int,
        name: String,
        desc: String,
        signature: String?,
        exceptions: Array<out String>?
    ): MethodVisitor {
        val mv = super.visitMethod(access, name, desc, signature, exceptions)
        return object : AdviceAdapter(Opcodes.ASM9, mv, access, name, desc) {
            override fun visitMethodInsn(
                opcode: Int,
                owner: String,
                name: String,
                descriptor: String,
                isInterface: Boolean
            ) {
                if (
                    opcode == INVOKESTATIC &&
                    owner.startsWith("kotlin/collections/CollectionsKt_") &&
                    (name == "removeFirst" || name == "removeLast") &&
                    descriptor == "(Ljava/util/List;)Ljava/lang/Object;"
                ) {
                    dup() // dup list
                    if (name == "removeFirst") {
                        visitInsn(ICONST_0)
                    } else {
                        visitMethodInsn(INVOKEINTERFACE, "java/util/List", "size", "()I", true)
                        visitInsn(ICONST_1)
                        visitInsn(ISUB) // size - 1
                    }
                    super.visitMethodInsn(
                        INVOKEINTERFACE,
                        "java/util/List",
                        "remove",
                        "(I)Ljava/lang/Object;",
                        true
                    )
                    return
                }
                super.visitMethodInsn(opcode, owner, name, descriptor, isInterface)
            }
        }
    }
}

