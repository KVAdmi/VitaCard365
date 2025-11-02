
import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    var bridge: CAPBridgeViewController?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        print("AppDelegate: Initializing app...")
        
        // Create the Capacitor bridge
        window = UIWindow(frame: UIScreen.main.bounds)
        bridge = CAPBridgeViewController()
        
        if let webView = bridge?.webView {
            // Habilitar debugging (suficiente para la mayoría de Xcode/Safari)
            webView.configuration.preferences.setValue(true, forKey: "developerExtrasEnabled")
            
            // Configurar el delegate para monitorear la carga
            webView.navigationDelegate = WebViewDelegate()
            
            // Forzar fondo blanco para debug
            webView.backgroundColor = .white
            webView.isOpaque = false
        }
        
        window?.rootViewController = bridge
        window?.makeKeyAndVisible()
        
        print("AppDelegate: Window setup complete")
        return true
    }
}

class WebViewDelegate: NSObject, WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        print("WebView: Started loading")
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        print("WebView: Finished loading successfully")
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        print("WebView: Failed to load with error: \(error.localizedDescription)")
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        print("WebView: Failed provisional navigation with error: \(error.localizedDescription)")
    }
}
