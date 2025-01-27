import Category from '../model/categories.schema.js';

const categories = [
  'Food', 'Festival', 'Wedding', 'Education',
  'Political', 'Concert', 'Sports', 'Gaming',
];

const seedCategories = async () => {
  let created = 0;
  let existing = 0;
  
  for (const categoryName of categories) {
    const existingCategory = await Category.findOne({ categoryName });
    if (existingCategory) {
      existing++;
    } else {
      const newCategory = new Category({ categoryName });
      await newCategory.save();
      created++;
    }
  }
  
  console.log(`Categories: ${created} created, ${existing} existing`);
};

export default seedCategories;