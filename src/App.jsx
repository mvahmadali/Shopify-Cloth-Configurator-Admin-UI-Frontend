import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AllProductsPage from './pages/AllProductsPage';
import AddProductPage from './pages/AddProductPage';
import EditProductPage from './pages/EditProductPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import './App.css';

function App() {
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
