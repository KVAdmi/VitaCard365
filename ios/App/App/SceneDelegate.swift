import UIKit
import Capacitor
import WebKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene,
             willConnectTo session: UISceneSession,
             options connectionOptions: UIScene.ConnectionOptions) {
    print("SceneDelegate: scene will connect")
    guard let windowScene = (scene as? UIWindowScene) else { 
      print("SceneDelegate: Failed to get windowScene")
      return 
    }
    
    let win = UIWindow(windowScene: windowScene)
    let bridgeVC = CAPBridgeViewController()
    
    // Configurar la WebView para debugging
    if let webView = bridgeVC.webView {
        webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
        print("SceneDelegate: WebView configuration set")
        
        // Agregar un observador para la carga de la página
        webView.navigationDelegate = NavigationDelegate(onFinish: { success in
            print("SceneDelegate: WebView load finished - success: \(success)")
        })
        // Color de marca para eliminar cualquier flash blanco
        let brand = UIColor(red: 12.0/255.0, green: 28.0/255.0, blue: 62.0/255.0, alpha: 1.0)
        webView.backgroundColor = brand
        webView.scrollView.backgroundColor = brand
        webView.isOpaque = false
    } else {
        print("SceneDelegate: WebView not initialized")
    }
    
    // Fondo de marca también en el contenedor y en la ventana
    let brand = UIColor(red: 12.0/255.0, green: 28.0/255.0, blue: 62.0/255.0, alpha: 1.0)
    bridgeVC.view.backgroundColor = brand
    win.backgroundColor = brand
    win.rootViewController = bridgeVC
    self.window = win
    win.makeKeyAndVisible()
    print("SceneDelegate: Window made visible")
    
    // Imprimir la URL que se está intentando cargar
    if let bridge = bridgeVC as? CAPBridgeViewController {
        print("SceneDelegate: Loading URL: \(String(describing: bridge.serverURL))")
    }
  }
}

class NavigationDelegate: NSObject, WKNavigationDelegate {
    let onFinish: (Bool) -> Void
    
    init(onFinish: @escaping (Bool) -> Void) {
        self.onFinish = onFinish
        super.init()
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        onFinish(true)
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("SceneDelegate: WebView load failed with error: \(error.localizedDescription)")
        onFinish(false)
    }
}
}
