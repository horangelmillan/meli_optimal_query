"use client";
import styles from "./page.module.css";
import { useState, useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    handleSearchCategories();
  }, []);

  const [product, setProduct] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('used');
  const [results, setResults] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [category, setCategory] = useState('Selecciona una categoría');

  const handleSearch = async () => {
    const response = await fetch(`https://api.mercadolibre.com/sites/MCO/search?q=${product}${category === "Selecciona una categoría" ? "" : `&category=${category}`}&condition=${condition}&price=${minPrice}-${maxPrice}`);
    const data = await response.json();
    let enrichedResults = await Promise.all(data.results.map(async (item: any) => {
      const sellerResponse = await fetch(`https://api.mercadolibre.com/users/${item.seller.id}`);
      const sellerData = await sellerResponse.json();
      if (!sellerData.seller_reputation.level_id) return undefined;
      return {
        id: item.id,
        title: item.title,
        price: item.price,
        seller: sellerData.nickname,
        sellerReputation: sellerData.seller_reputation.level_id,
        link: item.permalink
      };
    }));

    enrichedResults = enrichedResults.filter((item: any) => item);

    enrichedResults = enrichedResults.sort((a: any, b: any) => Number(b.sellerReputation[0]) - Number(a.sellerReputation[0]));

    setResults(enrichedResults);
  };

  const handleSearchCategories = async () => {
    const response = await fetch(`https://api.mercadolibre.com/sites/MCO/categories`);
    const data = await response.json();
    const enrichedResultsCat = await Promise.all(data.map(async (item: any) => {
      return {
        id: item.id,
        name: item.name
      };
    }));
    setCategories(enrichedResultsCat);
  };

  // Función para formatear el precio a formato colombiano
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(price);
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Buscar Productos en Mercado Libre</h1>
        <div className={styles.form}>
          <input
            type="text"
            placeholder="Producto"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
          <input
            type="number"
            placeholder="Precio mínimo"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <input
            type="number"
            placeholder="Precio máximo"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories && categories.map((item: any) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="used">Usado</option>
            <option value="new">Nuevo</option>
          </select>
          <button onClick={handleSearch}>Buscar</button>
        </div>

        {results.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Precio</th>
                <th>Vendedor</th>
                <th>Reputación del Vendedor</th>
                <th>Ver Producto</th>
              </tr>
            </thead>
            <tbody>
              {results.map(item => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{formatPrice(item.price)}</td> {/* Formatear el precio */}
                  <td>{item.seller}</td>
                  <td className={styles.reputation}>{item.sellerReputation}</td>
                  <td><a href={item.link} target="_blank" rel="noopener noreferrer">Ver</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
