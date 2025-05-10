import CanvasModel from '@/canvas';
import Customizer from '@/pages/Customizer';
import Home from '@/pages/Home';
export default function App() {
  return (
    <main className='app transition-all ease-in'>
      <Home data-testid='home-component' />
      <CanvasModel data-testid='canvas-model' />
      <Customizer data-testid='customizer' />
    </main>
  );
}
