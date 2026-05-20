import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import Favorites from './pages/Favorites';
import Recommendations from './pages/Recommendations';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-stone-50 text-stone-900">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
