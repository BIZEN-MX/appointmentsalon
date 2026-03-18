import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ShoppingCart, Heart, Star, Package, Plus, Edit2, Trash2, X, Check, Eye, EyeOff } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Marketplace = ({ isAdmin }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [wishlist, setWishlist] = useState([]);
  const [addedMap, setAddedMap] = useState({});

  // Admin specific state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    stock: '',
    image_url: ''
  });

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

  // ── Admin CRUD ────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', category: '', description: '', price: '', stock: '', image_url: '' });
    setShowModal(true);
  };

  const openEditModal = (p) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) fetchProducts();
    else alert('Error: ' + error.message);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = { ...formData, price: parseFloat(formData.price), stock: parseInt(formData.stock) };
    
    if (editingId) {
      const { error } = await supabase.from('products').update(payload).eq('id', editingId);
      if (!error) { setShowModal(false); fetchProducts(); }
      else alert('Error: ' + error.message);
    } else {
      const { error } = await supabase.from('products').insert([payload]);
      if (!error) { setShowModal(false); fetchProducts(); }
      else alert('Error: ' + error.message);
    }
  };

  const toggleStock = async (p) => {
    const newStock = p.stock > 0 ? 0 : 10;
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
    if (!error) fetchProducts();
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
          <h1>{isAdmin ? 'Gestión de Productos' : 'Marketplace'}</h1>
          <p>{isAdmin ? 'Administra el inventario, precios y existencias de la tienda.' : 'Lleva la experiencia de nuestro salón a tu hogar con productos exclusivos.'}</p>
          
          {isAdmin && (
            <button className="btn-primary fade-in" style={{ marginTop: '2rem' }} onClick={openAddModal}>
              <Plus size={18} /> NUEVO PRODUCTO
            </button>
          )}
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

                  {/* Admin actions bottom row */}
                  {isAdmin && (
                    <div className="mp-admin-actions fade-in">
                      <button onClick={() => openEditModal(product)} title="Editar"><Edit2 size={14}/></button>
                      <button onClick={() => toggleStock(product)} title={product.stock > 0 ? "Marcar agotado" : "Poner en stock"}>
                        {product.stock > 0 ? <EyeOff size={14}/> : <Eye size={14}/>}
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="del" title="Eliminar"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ADMIN MODAL ────────────────────────────────────────────── */}
      {showModal && (
        <div className="mp-modal-overlay fade-in">
          <div className="mp-modal card fade-in">
            <div className="mp-modal-header">
              <h3>{editingId ? 'Editar Producto' : 'Añadir Producto'}</h3>
              <button onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>
            <form onSubmit={handleSave} className="mp-form">
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Champú Reparador Keratina" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Hair, Skin, Nails..." />
                </div>
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock inicial</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} placeholder="0" />
                </div>
                <div className="form-group">
                  <label>URL Imagen (Unsplash)</label>
                  <input required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción corta</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe los beneficios..." />
              </div>
              <div className="mp-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary"><Check size={18} /> {editingId ? 'Guardar Cambios' : 'Crear Producto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Marketplace;
