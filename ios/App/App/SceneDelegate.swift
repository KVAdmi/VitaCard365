import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  var bridge: CAPBridgeViewController?

  func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
    guard let ws = scene as? UIWindowScene else { return }
    window = UIWindow(windowScene: ws)
    bridge = CAPBridgeViewController()   // carga www/index.html
    window?.rootViewController = bridge
    window?.makeKeyAndVisible()
  }
}
