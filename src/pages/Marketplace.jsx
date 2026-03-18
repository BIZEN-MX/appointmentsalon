import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Heart, Star, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Marketplace = () => {
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [wishlist, setWishlist] = useState([]);
  const [addedMap, setAddedMap] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase.from('products').select('*');
    if (error) console.error('Error fetching products:', error);
    else setProducts(data || []);
    setLoading(false);
  };

  const categories = ['Todos', ...new Set(products.map(p => p.category).filter(Boolean))];

  const filtered = activeCategory === 'Todos'
    ? products
    : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (product) => {
    addToCart(product);
    setAddedMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedMap(prev => ({ ...prev, [product.id]: false })), 1500);
  };

  const toggleWishlist = (id) => {
    setWishlist(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="mp-loading">
        <div className="mp-loading-ring" />
        <p>Cargando productos exclusivos...</p>
      </div>
    );
  }

  return (
    <div className="mp-page">
      {/* Hero Header */}
      <div className="mp-hero">
        <div className="mp-hero-overlay" />
        <div className="mp-hero-content">
          <span className="mp-hero-tag">Colección Exclusiva</span>
          <h1>Marketplace</h1>
          <p>Lleva la experiencia del Spa a tu hogar con nuestros productos de alta gama.</p>
        </div>
      </div>

      <div className="mp-main container">
        {/* Category Filter */}
        <div className="mp-filters">
          {categories.map(cat => (
            <button
              key={cat}
              className={`mp-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filtered.length === 0 ? (
          <div className="mp-empty">
            <Package size={64} />
            <h3>No hay productos en esta categoría</h3>
            <p>Pronto añadiremos más artículos.</p>
          </div>
        ) : (
          <div className="mp-grid">
            {filtered.map((product) => (
              <div key={product.id} className="mp-card">
                <div className="mp-card-img-wrap">
                  <img src={product.image_url} alt={product.name} className="mp-card-img" />
                  <button
                    className={`mp-wishlist ${wishlist.includes(product.id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                    title="Añadir a favoritos"
                  >
                    <Heart size={18} fill={wishlist.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.stock <= 3 && product.stock > 0 && (
                    <span className="mp-badge-low">Últimas unidades</span>
                  )}
                  {product.stock === 0 && (
                    <span className="mp-badge-out">Agotado</span>
                  )}
                </div>

                <div className="mp-card-body">
                  <span className="mp-category">{product.category}</span>
                  <h3 className="mp-product-name">{product.name}</h3>
                  <p className="mp-product-desc">{product.description}</p>

                  <div className="mp-card-footer">
                    <div className="mp-price-block">
                      <span className="mp-price">${Number(product.price).toFixed(2)}</span>
                      <span className="mp-stock">{product.stock > 0 ? `${product.stock} disponibles` : 'Agotado'}</span>
                    </div>
                    <button
                      className={`mp-add-btn ${addedMap[product.id] ? 'added' : ''}`}
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      {addedMap[product.id] ? (
                        '✓ Añadido'
                      ) : (
                        <><ShoppingCart size={16} /> Añadir</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
