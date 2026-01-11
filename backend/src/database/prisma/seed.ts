import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // AI Models
  const models = [
    {
      name: 'kandinsky-3.0',
      displayNameRu: 'Kandinsky 3.0',
      displayNameEn: 'Kandinsky 3.0',
      descriptionRu: 'Базовая модель генерации изображений',
      descriptionEn: 'Basic image generation model',
      costPerGeneration: 10.0,
      isActive: true,
      maxWidth: 1024,
      maxHeight: 1024,
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    },
    {
      name: 'kandinsky-3.1',
      displayNameRu: 'Kandinsky 3.1',
      displayNameEn: 'Kandinsky 3.1',
      descriptionRu: 'Улучшенная модель с более детализированными изображениями',
      descriptionEn: 'Enhanced model with more detailed images',
      costPerGeneration: 15.0,
      isActive: true,
      maxWidth: 1024,
      maxHeight: 1024,
      supportedRatios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    },
  ];

  for (const model of models) {
    await prisma.aiModel.upsert({
      where: { name: model.name },
      update: model,
      create: model,
    });
  }
  console.log('AI Models seeded');

  // Templates
  const templates = [
    // Portraits
    {
      nameRu: 'Классический портрет',
      nameEn: 'Classic Portrait',
      descriptionRu: 'Элегантный портрет в классическом стиле',
      descriptionEn: 'Elegant portrait in classic style',
      promptTemplate: 'Classic portrait of {description}, professional lighting, detailed face, high quality, 4k',
      category: 'portrait',
      sortOrder: 1,
    },
    {
      nameRu: 'Аватар в стиле аниме',
      nameEn: 'Anime Avatar',
      descriptionRu: 'Аниме стилизация портрета',
      descriptionEn: 'Anime style portrait',
      promptTemplate: 'Anime style portrait of {description}, vibrant colors, detailed eyes, studio ghibli inspired',
      category: 'anime',
      sortOrder: 2,
    },
    // Nature
    {
      nameRu: 'Пейзаж на закате',
      nameEn: 'Sunset Landscape',
      descriptionRu: 'Красивый пейзаж с закатом',
      descriptionEn: 'Beautiful sunset landscape',
      promptTemplate: 'Stunning sunset landscape with {description}, golden hour lighting, dramatic sky, professional photography',
      category: 'nature',
      sortOrder: 3,
    },
    {
      nameRu: 'Горный пейзаж',
      nameEn: 'Mountain Scenery',
      descriptionRu: 'Величественные горы',
      descriptionEn: 'Majestic mountains',
      promptTemplate: 'Majestic mountain landscape with {description}, epic scale, nature photography, 8k resolution',
      category: 'nature',
      sortOrder: 4,
    },
    // Fantasy
    {
      nameRu: 'Фэнтези мир',
      nameEn: 'Fantasy World',
      descriptionRu: 'Волшебный фэнтези мир',
      descriptionEn: 'Magical fantasy world',
      promptTemplate: 'Epic fantasy world with {description}, magical atmosphere, detailed environment, concept art style',
      category: 'fantasy',
      sortOrder: 5,
    },
    {
      nameRu: 'Дракон',
      nameEn: 'Dragon',
      descriptionRu: 'Эпический дракон',
      descriptionEn: 'Epic dragon',
      promptTemplate: 'Majestic dragon with {description}, detailed scales, epic composition, fantasy art',
      category: 'fantasy',
      sortOrder: 6,
    },
    // Sci-Fi
    {
      nameRu: 'Киберпанк город',
      nameEn: 'Cyberpunk City',
      descriptionRu: 'Футуристический город в стиле киберпанк',
      descriptionEn: 'Futuristic cyberpunk city',
      promptTemplate: 'Cyberpunk cityscape with {description}, neon lights, rain, blade runner style, detailed',
      category: 'scifi',
      sortOrder: 7,
    },
    {
      nameRu: 'Космическая станция',
      nameEn: 'Space Station',
      descriptionRu: 'Космическая станция в глубоком космосе',
      descriptionEn: 'Space station in deep space',
      promptTemplate: 'Detailed space station with {description}, stars background, sci-fi concept art, cinematic',
      category: 'scifi',
      sortOrder: 8,
    },
    // Art
    {
      nameRu: 'Масляная живопись',
      nameEn: 'Oil Painting',
      descriptionRu: 'В стиле классической масляной живописи',
      descriptionEn: 'Classical oil painting style',
      promptTemplate: 'Oil painting of {description}, classical art style, rich colors, masterpiece quality',
      category: 'art',
      sortOrder: 9,
    },
    {
      nameRu: 'Акварель',
      nameEn: 'Watercolor',
      descriptionRu: 'Нежная акварельная техника',
      descriptionEn: 'Soft watercolor technique',
      promptTemplate: 'Watercolor painting of {description}, soft colors, artistic, flowing strokes',
      category: 'art',
      sortOrder: 10,
    },
    // Architecture
    {
      nameRu: 'Современная архитектура',
      nameEn: 'Modern Architecture',
      descriptionRu: 'Современное архитектурное здание',
      descriptionEn: 'Modern architectural building',
      promptTemplate: 'Modern architecture building with {description}, minimalist design, professional photography',
      category: 'architecture',
      sortOrder: 11,
    },
    // Food
    {
      nameRu: 'Кулинарный шедевр',
      nameEn: 'Culinary Masterpiece',
      descriptionRu: 'Аппетитное блюдо',
      descriptionEn: 'Delicious dish',
      promptTemplate: 'Professional food photography of {description}, appetizing, perfect lighting, restaurant quality',
      category: 'food',
      sortOrder: 12,
    },
    // Design
    {
      nameRu: 'Логотип',
      nameEn: 'Logo Design',
      descriptionRu: 'Профессиональный дизайн логотипа',
      descriptionEn: 'Professional logo design',
      promptTemplate: 'Professional logo design for {description}, minimalist, vector style, clean lines',
      category: 'design',
      sortOrder: 13,
    },
    // Fashion
    {
      nameRu: 'Модный образ',
      nameEn: 'Fashion Look',
      descriptionRu: 'Стильный модный образ',
      descriptionEn: 'Stylish fashion look',
      promptTemplate: 'High fashion photography of {description}, vogue style, professional model, studio lighting',
      category: 'fashion',
      sortOrder: 14,
    },
    // Abstract
    {
      nameRu: 'Абстракция',
      nameEn: 'Abstract',
      descriptionRu: 'Абстрактное искусство',
      descriptionEn: 'Abstract art',
      promptTemplate: 'Abstract art composition with {description}, vibrant colors, dynamic shapes, contemporary',
      category: 'art',
      sortOrder: 15,
    },
  ];

  for (const template of templates) {
    const existing = await prisma.template.findFirst({
      where: { nameEn: template.nameEn },
    });

    if (!existing) {
      await prisma.template.create({ data: template });
    }
  }
  console.log('Templates seeded');

  // System Settings
  const settings = [
    {
      key: 'min_balance_for_generation',
      value: 10,
      description: 'Minimum balance required to generate an image',
    },
    {
      key: 'welcome_bonus',
      value: 50,
      description: 'Welcome bonus for new users',
    },
    {
      key: 'referral_bonus',
      value: 25,
      description: 'Bonus for referral',
    },
    {
      key: 'payment_amounts',
      value: [100, 300, 500, 1000],
      description: 'Available payment amounts',
    },
    {
      key: 'max_generations_per_day',
      value: 50,
      description: 'Maximum generations per day per user',
    },
  ];

  for (const setting of settings) {
    await prisma.systemSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: setting,
    });
  }
  console.log('System settings seeded');

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
