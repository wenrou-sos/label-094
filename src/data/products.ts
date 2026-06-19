import type { Product } from '@/types';

export const products: Product[] = [
  {
    id: 'p_001',
    sku: 'ADV-2024-001',
    name: '静谧系列智能按摩器',
    price: 399,
    originalPrice: 499,
    image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400',
    category: '个人护理',
    tags: ['静音', '防水', '可充电', '热销'],
    description: '采用人体工学设计，提供多档位个性化体验，帮助您舒缓身心压力，享受惬意时光。',
    usageGuide: '1. 长按电源键2秒开机；2. 轻触模式键切换档位；3. 使用后请清洁并置于干燥处；4. 建议使用前搭配专用护理液。',
    specifications: {
      material: '硅胶',
      materialDetail: '医用级液态硅胶，亲肤无刺激',
      waterproof: 'IPX7',
      charging: 'USB-C',
      noise: '35-42分贝',
      weight: '约180g',
      battery: '800mAh锂电池'
    },
    shelfId: 'shelf_a',
    inStock: true,
    stock: 32,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_002',
    sku: 'ADV-2024-002',
    name: '星耀系列无线遥控套装',
    price: 688,
    originalPrice: 888,
    image: 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400',
    category: '情侣系列',
    tags: ['遥控', '防水', '无线', '新品'],
    description: '十档变频模式搭配远程遥控，距离不再是阻碍，让亲密无间更添趣味。',
    usageGuide: '1. 打开控制器并配对；2. 选择适合的模式与强度；3. 使用专用润滑剂体验更佳；4. 遥控有效距离约8米。',
    specifications: {
      material: '硅胶',
      materialDetail: '食品级硅胶+ABS外壳',
      waterproof: 'IPX6',
      charging: '无线充电',
      noise: '38-45分贝',
      weight: '约120g',
      distance: '遥控距离8-10米'
    },
    shelfId: 'shelf_a',
    inStock: true,
    stock: 18,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_003',
    sku: 'ADV-2024-003',
    name: '水晶系列透明质感玻璃棒',
    price: 258,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400',
    category: '精品系列',
    tags: ['玻璃', '质感', '易清洁', '推荐'],
    description: '高硼硅玻璃材质，晶莹剔透，温度适应性强，冷热皆宜，带来纯净触感体验。',
    usageGuide: '1. 使用前请检查有无破损；2. 可温水中温热或冷藏体验；3. 使用后温水清洗即可；4. 避免与尖锐硬物碰撞。',
    specifications: {
      material: '玻璃',
      materialDetail: '高硼硅耐热玻璃',
      waterproof: 'IPX8',
      charging: '无需充电',
      noise: '0分贝',
      weight: '约220g',
      temp: '耐温-20°C至150°C'
    },
    shelfId: 'shelf_b',
    inStock: true,
    stock: 25,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_004',
    sku: 'ADV-2024-004',
    name: 'TPE超软触感飞机杯',
    price: 199,
    originalPrice: 259,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400',
    category: '男士系列',
    tags: ['TPE', '柔软', '通道设计', '畅销'],
    description: '进口TPE材质，3D立体通道设计，模拟真实触感，可反复使用，私密收纳。',
    usageGuide: '1. 打开入口处涂抹适量润滑剂；2. 使用后倒置清洗晾干；3. 可配合爽身粉保养；4. 避免阳光直射。',
    specifications: {
      material: 'TPE',
      materialDetail: '进口医用级TPE弹性体',
      waterproof: 'IPX5',
      charging: '无需充电',
      noise: '0分贝',
      weight: '约550g',
      inner: '3D立体颗粒通道'
    },
    shelfId: 'shelf_b',
    inStock: true,
    stock: 42,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_005',
    sku: 'ADV-2024-005',
    name: '智能APP蓝牙版情趣套装',
    price: 899,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400',
    category: '智能系列',
    tags: ['蓝牙', 'APP', '互动', '高科技'],
    description: '蓝牙连接专属APP，远程互动、自定义模式、分享玩法，智能科技开启全新体验。',
    usageGuide: '1. 下载官方APP并注册；2. 长按电源键开启蓝牙配对；3. APP内选择模式或自定义波形；4. 可邀请好友远程控制。',
    specifications: {
      material: '硅胶',
      materialDetail: '医用硅胶+ABS工程塑料',
      waterproof: 'IPX7',
      charging: 'USB-C',
      noise: '32-40分贝',
      weight: '约150g',
      bt: '蓝牙5.0，续航约2小时'
    },
    shelfId: 'shelf_c',
    inStock: false,
    stock: 0,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_006',
    sku: 'ADV-2024-006',
    name: '金属质感多频震动环',
    price: 328,
    originalPrice: 398,
    image: 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c?w=400',
    category: '情侣系列',
    tags: ['金属', '震动', '持久', '推荐'],
    description: '医用不锈钢材质，多频震动模式，双人情趣辅助，带来全新感官体验。',
    usageGuide: '1. 建议佩戴前涂抹少量润滑剂；2. 短按切换震动模式；3. 使用后酒精棉片擦拭消毒；4. 放置于配套收纳袋。',
    specifications: {
      material: '金属',
      materialDetail: '316医用级不锈钢',
      waterproof: 'IPX7',
      charging: '电池',
      noise: '40-48分贝',
      weight: '约85g',
      modes: '7种震动模式'
    },
    shelfId: 'shelf_c',
    inStock: true,
    stock: 15,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_007',
    sku: 'ADV-2024-007',
    name: '香氛主题情趣精油套装',
    price: 168,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400',
    category: '护理系列',
    tags: ['精油', '香氛', '保湿', '赠品多'],
    description: '多款植物香氛配方，水润保湿不油腻，搭配专用香调，营造浪漫私密氛围。',
    usageGuide: '1. 取适量精油于掌心温热；2. 涂抹于所需部位；3. 可配合按摩手法；4. 使用后皮肤无残留，无需冲洗。',
    specifications: {
      material: '其他',
      materialDetail: '天然植物精油基底',
      waterproof: '不防水',
      charging: '无需充电',
      noise: '0分贝',
      weight: '约30ml×4瓶',
      scents: '玫瑰/茉莉/檀香/薰衣草'
    },
    shelfId: 'shelf_d',
    inStock: true,
    stock: 28,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_008',
    sku: 'ADV-2024-008',
    name: 'ABS材质角色扮演服饰套装',
    price: 458,
    originalPrice: 568,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
    category: '情趣内衣',
    tags: ['套装', '多件', '蕾丝', '热门'],
    description: '精致蕾丝与弹力面料结合，多件组合套装，完美修饰身形，增添生活情调。',
    usageGuide: '1. 建议30°C以下水温手洗；2. 阴凉处平铺晾干；3. 避免揉搓蕾丝部位；4. 配套收纳袋保存。',
    specifications: {
      material: '其他',
      materialDetail: '锦纶+氨纶+蕾丝花边',
      waterproof: '不防水',
      charging: '无需充电',
      noise: '0分贝',
      weight: '约180g',
      pieces: '含5件单品组合'
    },
    shelfId: 'shelf_d',
    inStock: true,
    stock: 38,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_009',
    sku: 'ADV-2024-009',
    name: '超长续航磁吸充电按摩棒',
    price: 578,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400',
    category: '个人护理',
    tags: ['长续航', '磁吸充电', '多模式', '推荐'],
    description: '磁吸式充电设计，2000mAh超大容量，一次充电续航可达6小时，8种模式任选。',
    usageGuide: '1. 磁吸接口靠近自动吸附充电；2. 按功能键切换不同模式；3. 全机身水洗方便清洁；4. 低电量时LED指示灯提醒。',
    specifications: {
      material: '硅胶',
      materialDetail: '亲肤硅胶+ABS底座',
      waterproof: 'IPX7',
      charging: 'USB-C',
      noise: '36-44分贝',
      weight: '约260g',
      battery: '2000mAh，续航6小时'
    },
    shelfId: 'shelf_a',
    inStock: true,
    stock: 22,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_010',
    sku: 'ADV-2024-010',
    name: '双重结构男用训练器',
    price: 348,
    originalPrice: 428,
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    category: '男士系列',
    tags: ['训练', '双结构', '可调节', '新品'],
    description: '内外双层结构，可调节松紧度，渐进式训练设计，科学锻炼提升持久力。',
    usageGuide: '1. 从最松档位开始训练；2. 每次10-15分钟循序渐进；3. 使用前涂抹专用润滑剂；4. 用完洗净晾干保存。',
    specifications: {
      material: 'TPE',
      materialDetail: '高弹TPE+PP调节卡扣',
      waterproof: 'IPX6',
      charging: '无需充电',
      noise: '0分贝',
      weight: '约380g',
      levels: '5档松紧可调'
    },
    shelfId: 'shelf_b',
    inStock: true,
    stock: 3,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_011',
    sku: 'ADV-2024-011',
    name: '真空负压物理锻炼仪',
    price: 788,
    image: 'https://images.unsplash.com/photo-1551698618-38a3b93c2a4b?w=400',
    category: '男士系列',
    tags: ['物理', '智能', '电动', '高科技'],
    description: '智能真空负压技术，精准控压，搭配液晶显示，科学物理锻炼，安全有效。',
    usageGuide: '1. 涂抹润滑剂于密封口；2. 按启动键选择压力档位；3. 每次使用8-10分钟；4. 建议每周3-4次规律使用。',
    specifications: {
      material: 'ABS',
      materialDetail: '医用级ABS筒体+硅胶密封圈',
      waterproof: 'IPX5',
      charging: 'USB-C',
      noise: '42-50分贝',
      weight: '约450g',
      modes: '4档压力模式可选'
    },
    shelfId: 'shelf_b',
    inStock: true,
    stock: 4,
    minStock: 10,
    maxStock: 50
  },
  {
    id: 'p_012',
    sku: 'ADV-2024-012',
    name: '便携迷你口袋震动器',
    price: 159,
    originalPrice: 199,
    image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400',
    category: '个人护理',
    tags: ['便携', '迷你', '小巧', '入门'],
    description: '拇指大小轻巧便携，美妆蛋外观隐蔽设计，新手入门首选，外出旅行也方便。',
    usageGuide: '1. 旋转底部启动/调节档位；2. 搭配护垫使用更稳固；3. 纽扣电池可替换；4. 收纳于专属小布袋中。',
    specifications: {
      material: 'ABS',
      materialDetail: '哑光ABS外壳，防指纹',
      waterproof: 'IPX4',
      charging: '电池',
      noise: '38-45分贝',
      weight: '约25g',
      size: '约3.5×6.5cm'
    },
    shelfId: 'shelf_d',
    inStock: true,
    stock: 35,
    minStock: 10,
    maxStock: 50
  }
];

export const shelfInfo: Record<string, string> = {
  shelf_a: 'A区 · 女士护理区',
  shelf_b: 'B区 · 男士专享区',
  shelf_c: 'C区 · 情侣互动区',
  shelf_d: 'D区 · 配饰周边区'
};

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getProductsByShelf(shelfId: string): Product[] {
  return products.filter(p => p.shelfId === shelfId);
}
