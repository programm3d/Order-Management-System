import Header from "./Header";
import Footer from "./Footer";
import { useWebSocket } from "../../hooks/useWebSocket";

const Layout = ({ children }) => {
  useWebSocket();

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
