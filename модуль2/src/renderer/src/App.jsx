import { useEffect, useMemo, useState } from 'react'

const emptyCake = {
  article: '',
  name: '',
  unit_id: '',
  price: '',
  confectionery_id: '',
  cake_type_id: '',
  discount_percent: 0,
  stock_quantity: 0,
  description: '',
  photo_filename: ''
}

function App() {
  const [cakes, setCakes] = useState([])
  const [references, setReferences] = useState({
    units: [],
    confectioneries: [],
    cakeTypes: []
  })
  const [form, setForm] = useState(emptyCake)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const isEditing = useMemo(() => Boolean(form.product_id), [form.product_id])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setIsLoading(true)
      const [cakesData, referencesData] = await Promise.all([
        window.api.getCakes(),
        window.api.getReferences()
      ])

      setCakes(cakesData)
      setReferences(referencesData)
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setIsLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function editCake(cake) {
    setForm({
      product_id: cake.product_id,
      article: cake.article,
      name: cake.name,
      unit_id: cake.unit_id,
      price: cake.price,
      confectionery_id: cake.confectionery_id,
      cake_type_id: cake.cake_type_id,
      discount_percent: cake.discount_percent,
      stock_quantity: cake.stock_quantity,
      description: cake.description || '',
      photo_filename: cake.photo_filename || ''
    })
    setMessage('')
    setError('')
  }

  async function saveCake(event) {
    event.preventDefault()

    try {
      if (isEditing) {
        await window.api.updateCake(form)
        setMessage('Торт обновлен')
      } else {
        await window.api.createCake(form)
        setMessage('Торт добавлен')
      }

      setForm(emptyCake)
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  async function removeCake(productId) {
    if (!confirm('Удалить торт?')) {
      return
    }

    try {
      await window.api.deleteCake(productId)
      setMessage('Торт удален')
      await loadData()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <main className="page">
      <section className="header">
        <div>
          <p className="subtitle">Модуль 2</p>
          <h1>Торты</h1>
        </div>
        <button className="secondary" onClick={() => setForm(emptyCake)}>
          Новый торт
        </button>
      </section>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert danger">{error}</div>}

      <form className="form" onSubmit={saveCake}>
        <h2>{isEditing ? 'Редактирование' : 'Добавление'}</h2>

        <div className="grid">
          <label>
            Артикул
            <input name="article" value={form.article} onChange={handleChange} required maxLength="20" />
          </label>
          <label>
            Название
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Единица
            <select name="unit_id" value={form.unit_id} onChange={handleChange} required>
              <option value="">Выберите</option>
              {references.units.map((unit) => (
                <option key={unit.unit_id} value={unit.unit_id}>{unit.name}</option>
              ))}
            </select>
          </label>
          <label>
            Цена
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
          </label>
          <label>
            Кондитерская
            <select name="confectionery_id" value={form.confectionery_id} onChange={handleChange} required>
              <option value="">Выберите</option>
              {references.confectioneries.map((item) => (
                <option key={item.confectionery_id} value={item.confectionery_id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label>
            Тип торта
            <select name="cake_type_id" value={form.cake_type_id} onChange={handleChange} required>
              <option value="">Выберите</option>
              {references.cakeTypes.map((type) => (
                <option key={type.cake_type_id} value={type.cake_type_id}>{type.name}</option>
              ))}
            </select>
          </label>
          <label>
            Скидка, %
            <input name="discount_percent" type="number" min="0" max="100" value={form.discount_percent} onChange={handleChange} required />
          </label>
          <label>
            Остаток
            <input name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={handleChange} required />
          </label>
          <label>
            Фото
            <input name="photo_filename" value={form.photo_filename} onChange={handleChange} />
          </label>
          <label className="wide">
            Описание
            <textarea name="description" value={form.description} onChange={handleChange} rows="3" />
          </label>
        </div>

        <div className="actions">
          {isEditing && (
            <button className="secondary" type="button" onClick={() => setForm(emptyCake)}>
              Отмена
            </button>
          )}
          <button type="submit">{isEditing ? 'Сохранить' : 'Добавить'}</button>
        </div>
      </form>

      <section className="tableWrap">
        {isLoading ? (
          <p className="loading">Загрузка...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Артикул</th>
                <th>Название</th>
                <th>Тип</th>
                <th>Кондитерская</th>
                <th>Цена</th>
                <th>Скидка</th>
                <th>Остаток</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cakes.map((cake) => (
                <tr key={cake.product_id}>
                  <td>{cake.article}</td>
                  <td>
                    <strong>{cake.name}</strong>
                    {cake.photo_filename && <span>{cake.photo_filename}</span>}
                  </td>
                  <td>{cake.cake_type_name}</td>
                  <td>{cake.confectionery_name}</td>
                  <td>{Number(cake.price).toLocaleString('ru-RU')} ₽</td>
                  <td>{cake.discount_percent}%</td>
                  <td>{cake.stock_quantity} {cake.unit_name}</td>
                  <td className="rowActions">
                    <button className="secondary" onClick={() => editCake(cake)}>Изменить</button>
                    <button className="danger" onClick={() => removeCake(cake.product_id)}>Удалить</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

export default App
