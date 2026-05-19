const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

// Транслитерация
function transliterate(text) {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    ' ': '-', '_': '-'
  };

  return text.toLowerCase()
    .split('')
    .map(char => map[char] || char)
    .join('')
    .replace(/[^a-z0-9-_.~]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Данные брендов
const brands = [
  { name: 'RRR', slug: 'rrr', description: 'Relax Refresh Revive' },
  { name: 'Naturals Remedies', slug: 'naturals-remedies' },
  { name: 'Naturals', slug: 'naturals' },
  { name: 'Pure Herbs', slug: 'pure-herbs' },
  { name: 'Hydro Touch', slug: 'hydro-touch' },
  { name: 'Be_Different', slug: 'be-different' },
  { name: 'Aqua Senes', slug: 'aqua-senes' },
];

// Данные категории
const category = {
  name: 'Lifestyle',
  slug: 'lifestyle',
  description: 'Косметика для гостиниц'
};

// Данные товаров
const products = [
  // RRR
  { name: "Гель для душа", brand: "RRR", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "RRR", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "RRR", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "RRR", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "RRR", volume: "15 г", type: "Мыло" },
  { name: "Мыло", brand: "RRR", volume: "30 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "RRR", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "RRR", volume: "300 мл", type: "Гель для рук и тела" },
  { name: "Кондиционер", brand: "RRR", volume: "300 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "RRR", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "RRR", volume: "3 л", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "RRR", volume: "3 л", type: "Гель для рук и тела" },
  { name: "Кондиционер", brand: "RRR", volume: "3 л", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "RRR", volume: "3 л", type: "Молочко для тела" },

  // Naturals Remedies
  { name: "Гель для душа", brand: "Naturals Remedies", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Naturals Remedies", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Naturals Remedies", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Naturals Remedies", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Naturals Remedies", volume: "15 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Naturals Remedies", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Naturals Remedies", volume: "300 мл", type: "Гель для рук и тела" },
  { name: "Кондиционер", brand: "Naturals Remedies", volume: "300 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Naturals Remedies", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Naturals Remedies", volume: "3 л", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Naturals Remedies", volume: "3 л", type: "Гель для рук и тела" },
  { name: "Кондиционер", brand: "Naturals Remedies", volume: "3 л", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Naturals Remedies", volume: "3 л", type: "Молочко для тела" },

  // Naturals
  { name: "Гель для душа", brand: "Naturals", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Naturals", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Naturals", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Naturals", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Naturals", volume: "15 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Naturals", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для душа", brand: "Naturals", volume: "300 мл", type: "Гель для душа" },
  { name: "Жидкое мыло", brand: "Naturals", volume: "300 мл", type: "Жидкое мыло" },
  { name: "Кондиционер", brand: "Naturals", volume: "300 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Naturals", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Naturals", volume: "5 л", type: "Шампунь для волос и тела" },
  { name: "Молочко для тела", brand: "Naturals", volume: "1 л", type: "Молочко для тела" },
  { name: "Кондиционер", brand: "Naturals", volume: "1 л", type: "Кондиционер" },

  // Pure Herbs
  { name: "Гель для душа", brand: "Pure Herbs", volume: "35 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Pure Herbs", volume: "35 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Pure Herbs", volume: "35 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Pure Herbs", volume: "35 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Pure Herbs", volume: "15 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Pure Herbs", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Жидкое мыло", brand: "Pure Herbs", volume: "300 мл", type: "Жидкое мыло" },
  { name: "Кондиционер", brand: "Pure Herbs", volume: "300 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Pure Herbs", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Pure Herbs", volume: "5 л", type: "Шампунь для волос и тела" },
  { name: "Жидкое мыло", brand: "Pure Herbs", volume: "5 л", type: "Жидкое мыло" },
  { name: "Молочко для тела", brand: "Pure Herbs", volume: "1 л", type: "Молочко для тела" },
  { name: "Кондиционер", brand: "Pure Herbs", volume: "1 л", type: "Кондиционер" },

  // Hydro Touch
  { name: "Гель для душа", brand: "Hydro Touch", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Hydro Touch", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Hydro Touch", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Hydro Touch", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Hydro Touch", volume: "25 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Hydro Touch", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Hydro Touch", volume: "300 мл", type: "Гель для рук и тела" },
  { name: "Кондиционер", brand: "Hydro Touch", volume: "300 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Hydro Touch", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Hydro Touch", volume: "5 л", type: "Шампунь для волос и тела" },
  { name: "Жидкое мыло", brand: "Hydro Touch", volume: "5 л", type: "Жидкое мыло" },
  { name: "Молочко для тела", brand: "Hydro Touch", volume: "1 л", type: "Молочко для тела" },
  { name: "Кондиционер", brand: "Hydro Touch", volume: "1 л", type: "Кондиционер" },

  // Be_Different
  { name: "Гель для душа", brand: "Be_Different", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Be_Different", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Be_Different", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Be_Different", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Be_Different", volume: "20 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Be_Different", volume: "500 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Be_Different", volume: "500 мл", type: "Гель для рук и тела" },
  { name: "Молочко для тела", brand: "Be_Different", volume: "500 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Be_Different", volume: "3 л", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Be_Different", volume: "3 л", type: "Гель для рук и тела" },
  { name: "Молочко для тела", brand: "Be_Different", volume: "3 л", type: "Молочко для тела" },

  // Aqua Senes
  { name: "Гель для душа", brand: "Aqua Senes", volume: "30 мл", type: "Гель для душа" },
  { name: "Шампунь", brand: "Aqua Senes", volume: "30 мл", type: "Шампунь" },
  { name: "Кондиционер", brand: "Aqua Senes", volume: "30 мл", type: "Кондиционер" },
  { name: "Молочко для тела", brand: "Aqua Senes", volume: "30 мл", type: "Молочко для тела" },
  { name: "Мыло", brand: "Aqua Senes", volume: "30 г", type: "Мыло" },
  { name: "Шампунь для волос и тела", brand: "Aqua Senes", volume: "300 мл", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Aqua Senes", volume: "300 мл", type: "Гель для рук и тела" },
  { name: "Молочко для тела", brand: "Aqua Senes", volume: "300 мл", type: "Молочко для тела" },
  { name: "Шампунь для волос и тела", brand: "Aqua Senes", volume: "3 л", type: "Шампунь для волос и тела" },
  { name: "Гель для рук и тела", brand: "Aqua Senes", volume: "3 л", type: "Гель для рук и тела" },
  { name: "Молочко для тела", brand: "Aqua Senes", volume: "3 л", type: "Молочко для тела" },
];

async function importData() {
  try {
    console.log('Starting import...\n');

    // 1. Создаём бренды
    console.log('Creating brands...');
    const brandMap = {};
    for (const brand of brands) {
      try {
        const response = await axios.post(`${API_URL}/brands`, { data: brand });
        brandMap[brand.name] = response.data.data.id;
        console.log(`✓ Created brand: ${brand.name}`);
      } catch (error) {
        console.log(`✗ Brand ${brand.name} might already exist`);
      }
    }

    // Получаем все бренды
    const brandsResponse = await axios.get(`${API_URL}/brands`);
    brandsResponse.data.data.forEach(brand => {
      brandMap[brand.name] = brand.id;
    });

    // 2. Создаём категорию
    console.log('\nCreating category...');
    let categoryId;
    try {
      const response = await axios.post(`${API_URL}/categories`, { data: category });
      categoryId = response.data.data.id;
      console.log(`✓ Created category: ${category.name}`);
    } catch (error) {
      const categoriesResponse = await axios.get(`${API_URL}/categories`);
      const lifestyleCategory = categoriesResponse.data.data.find(c => c.slug === 'lifestyle');
      if (lifestyleCategory) {
        categoryId = lifestyleCategory.id;
        console.log(`✓ Category ${category.name} already exists`);
      }
    }

    // 3. Создаём товары (упрощенная версия без связей)
    console.log('\nCreating products...');
    let successCount = 0;
    let counter = 1;
    for (const product of products) {
      try {
        const slug = transliterate(`${product.brand}-${product.type}-${product.volume}-${counter}`);

        const productData = {
          name: `${product.brand} ${product.name} ${product.volume}`,
          slug: slug,
          description: [
            {
              type: 'paragraph',
              children: [{ type: 'text', text: `${product.type} от ${product.brand}. Объём: ${product.volume}` }]
            }
          ],
          is_active: true
        };

        await axios.post(`${API_URL}/products`, { data: productData });
        successCount++;
        counter++;
        console.log(`✓ Created: ${productData.name}`);
      } catch (error) {
        console.log(`✗ Failed: ${product.brand} ${product.name} ${product.volume} - ${error.response?.data?.error?.message || 'Unknown error'}`);
      }
    }

    console.log(`\n✅ Import complete! Created ${successCount} products.`);
  } catch (error) {
    console.error('Import failed:', error.message);
  }
}

importData();
