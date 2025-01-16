import Canvas from "@/canvas";
import Customizer from "../pages/Customizer";
import Home from "../pages/Home";
export default function App() {
  return (
    <main className="app transition-all ease-in">
      <Home />
      <Canvas />
      <Customizer />
    </main>
  );
}
