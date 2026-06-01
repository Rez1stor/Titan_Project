import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import CreateProduct from './pages/CreateProduct';
import EditProduct from './pages/EditProduct';
import Favorites from './pages/Favorites';
import Recommendations from './pages/Recommendations';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AlcoholFinderPage from './pages/AlcoholFinderPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg-main text-text-main flex flex-col font-inter">
        <Navbar />
        <main className="container mx-auto px-4 py-8 flex-1 max-w-[1200px]">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/finder" element={<AlcoholFinderPage />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/product/create" element={<CreateProduct />} />
            <Route path="/product/:id/edit" element={<EditProduct />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
