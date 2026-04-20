import { GALLERY_FILTERS } from '../../config/constants'

export default function FilterBar({ activeFilter, onFilterChange, availableCategories = [] }) {
  const categoryFilters = availableCategories.map(cat => ({
    key: `category_${cat}`,
    label: cat
  }))

  const allFilters = [...GALLERY_FILTERS, ...categoryFilters]

  return (
    <div className="filter-bar">
      <div className="filter-scroll">
        {allFilters.map(f => (
          <button
            key={f.key}
            className={`filter-pill ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => onFilterChange(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}
