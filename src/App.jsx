import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AllProductsPage from './pages/AllProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import './App.css';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1024px)';

function App() {
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const handleViewportChange = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleViewportChange);
    } else {
      mediaQuery.addListener(handleViewportChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleViewportChange);
      } else {
        mediaQuery.removeListener(handleViewportChange);
      }
    };
  }, []);

  if (isMobileViewport) {
    return (
      <div className="desktop-only-screen">
        <div className="desktop-only-card">
          <h1>Desktop Only</h1>
          <p>
            This admin application is only supported on desktop screens.
            Please open it on a laptop or desktop computer to continue.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <Router>
        <div className="app">
          <Toast />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/all-products" element={<AllProductsPage />} />
              <Route path="/add-product" element={<AddProductPage />} />
              <Route path="/edit-product" element={<EditProductPage />} />
              <Route path="/configurator/:productId" element={<ConfiguratorPage />} />
            </Routes>
          </main>
      </div>
    </Router>
    </ToastProvider>
  );
}

export default App;
