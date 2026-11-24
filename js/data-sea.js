/* 海产替代池：过敏开关关掉时，把菜单里的淡水鱼菜位换成海鱼 / 虾蟹 / 贝类。
   每个替代菜对应 data-menu.js 里的一个「菜位」，key = 天数|餐次|该餐第几道。
   作者：按原来那道菜的形态配的（汤配汤、蒸配蒸、红烧配红烧），分量对齐。 */
window.SEA = (function () {
  const d = (name, ingredients, steps, tag) => ({ name, ingredients, steps, tag });

  // 20 个淡水鱼菜位 → 海产替代（海鱼 9 / 虾蟹 7 / 贝类 4）
  const SWAP = {
    '1|dinner|0': d('清蒸鲳鱼', [
      { name: '鲳鱼', amount: '100g' }, { name: '姜丝', amount: '5g' },
      { name: '葱段', amount: '10g' }, { name: '蒸鱼豉油', amount: '5ml' }
    ], ['鲳鱼洗净，两面各划两刀，鱼身铺姜丝', '水开后上锅蒸 8 分钟', '倒掉盘中汤水，淋豉油、撒葱段'], 'seaFish'),

    '3|dinner|0': d('花蛤豆腐汤', [
      { name: '花蛤', amount: '150g' }, { name: '豆腐', amount: '80g' },
      { name: '姜片', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['花蛤提前用盐水吐沙 2 小时', '水开下姜片和豆腐块煮 3 分钟', '下花蛤，开口就关火，撒葱花'], 'shellfish'),

    '6|dinner|0': d('清蒸带鱼段', [
      { name: '带鱼', amount: '100g' }, { name: '姜丝', amount: '5g' }, { name: '葱段', amount: '10g' }
    ], ['带鱼去内脏切段，擦干水分，铺姜丝', '水开后蒸 8 分钟', '撒葱段，淋一点生抽'], 'seaFish'),

    '8|dinner|0': d('黄鱼豆腐汤', [
      { name: '小黄鱼', amount: '100g' }, { name: '豆腐', amount: '80g' },
      { name: '姜片', amount: '5g' }, { name: '葱段', amount: '10g' }
    ], ['小黄鱼擦干，两面煎至微黄', '加开水没过鱼身，放姜片煮 5 分钟', '下豆腐再煮 3 分钟，撒葱段'], 'seaFish'),

    '10|dinner|1': d('虾滑萝卜丝汤', [
      { name: '虾滑', amount: '80g' }, { name: '白萝卜', amount: '100g' },
      { name: '姜丝', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['白萝卜切细丝，煮到透明发软', '虾滑挤成小丸子下锅', '浮起来再煮 1 分钟，撒葱花'], 'shrimpCrab'),

    '11|dinner|0': d('虾仁蛋花汤', [
      { name: '虾仁', amount: '60g' }, { name: '鸡蛋', amount: '1个' }, { name: '葱花', amount: '5g' }
    ], ['虾仁挑去虾线，焯到变色捞出', '水开后关小火，慢慢淋入蛋液', '放回虾仁，撒葱花'], 'shrimpCrab'),

    '12|dinner|0': d('蛤蜊蒸蛋', [
      { name: '蛤蜊', amount: '150g' }, { name: '鸡蛋', amount: '2个' }, { name: '温水', amount: '150ml' }
    ], ['蛤蜊吐沙后焯到开口，捞出摆进碗里', '蛋液加温水打匀，过筛倒进碗中', '中小火蒸 10 分钟，关火焖 2 分钟'], 'shellfish'),

    '14|lunch|0': d('三文鱼炒饭', [
      { name: '三文鱼', amount: '80g' }, { name: '米饭', amount: '150g' }, { name: '胡萝卜', amount: '30g' },
      { name: '豌豆', amount: '20g' }, { name: '鸡蛋', amount: '1个' }
    ], ['三文鱼煎熟，用铲子压成小块', '炒散鸡蛋盛出，再炒胡萝卜和豌豆', '下米饭、三文鱼和鸡蛋翻匀'], 'seaFish'),

    '15|lunch|0': d('虾丸冬瓜汤', [
      { name: '虾丸', amount: '80g' }, { name: '冬瓜', amount: '100g' }, { name: '葱花', amount: '5g' }
    ], ['冬瓜去皮切薄片，煮到半透明', '下虾丸煮 3 分钟', '撒葱花，滴两滴香油'], 'shrimpCrab'),

    '17|lunch|0': d('红烧带鱼', [
      { name: '带鱼', amount: '100g' }, { name: '姜片', amount: '5g' }, { name: '葱段', amount: '10g' },
      { name: '生抽', amount: '5ml' }, { name: '白糖', amount: '2g' }
    ], ['带鱼切段擦干，两面煎到金黄', '下姜片葱段，加生抽、糖和半碗水', '小火焖 5 分钟，收汁'], 'seaFish'),

    '18|lunch|0': d('番茄虾仁意面', [
      { name: '虾仁', amount: '80g' }, { name: '意面', amount: '60g' },
      { name: '番茄', amount: '100g' }, { name: '洋葱', amount: '20g' }
    ], ['意面煮 8 分钟捞出', '番茄洋葱炒出沙', '下虾仁炒到变色，拌入意面'], 'shrimpCrab'),

    '19|dinner|0': d('鳕鱼蒸蛋', [
      { name: '鳕鱼', amount: '60g' }, { name: '鸡蛋', amount: '2个' }, { name: '温水', amount: '150ml' }
    ], ['鳕鱼解冻后仔细摸一遍，确认没刺，切小块', '蛋液加温水打匀过筛', '铺上鳕鱼，中小火蒸 10 分钟'], 'seaFish'),

    '20|dinner|0': d('三文鱼粥', [
      { name: '三文鱼', amount: '60g' }, { name: '大米', amount: '40g' },
      { name: '胡萝卜', amount: '20g' }, { name: '姜丝', amount: '3g' }
    ], ['大米煮成软烂的粥', '下胡萝卜丁煮 5 分钟', '三文鱼切小丁下锅，煮 3 分钟关火'], 'seaFish'),

    '21|lunch|0': d('番茄鳕鱼块', [
      { name: '鳕鱼', amount: '100g' }, { name: '番茄', amount: '100g' },
      { name: '洋葱', amount: '20g' }, { name: '姜片', amount: '5g' }
    ], ['鳕鱼切块，两面煎至微黄盛出', '番茄炒出沙，下洋葱丁', '放回鳕鱼，加两勺水小火焖 3 分钟'], 'seaFish'),

    '22|dinner|0': d('扇贝豆腐煲', [
      { name: '扇贝肉', amount: '80g' }, { name: '豆腐', amount: '100g' },
      { name: '姜丝', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['豆腐切块煎到两面定型', '下扇贝肉和姜丝翻炒', '加半碗水焖 3 分钟，撒葱花'], 'shellfish'),

    '23|dinner|0': d('清蒸小黄鱼', [
      { name: '小黄鱼', amount: '100g' }, { name: '姜丝', amount: '5g' }, { name: '葱段', amount: '10g' }
    ], ['小黄鱼去鳞洗净，铺姜丝', '水开后蒸 7 分钟（鱼小，别蒸老）', '倒掉汤水，淋生抽撒葱段'], 'seaFish'),

    '25|lunch|0': d('酸汤虾滑', [
      { name: '虾滑', amount: '100g' }, { name: '番茄', amount: '80g' },
      { name: '金针菇', amount: '50g' }, { name: '姜丝', amount: '5g' }
    ], ['番茄炒出沙，加水煮开', '下金针菇煮 2 分钟', '虾滑挤成小丸下锅，浮起即可'], 'shrimpCrab'),

    '25|dinner|0': d('蟹粉豆腐', [
      { name: '蟹肉', amount: '60g' }, { name: '豆腐', amount: '120g' },
      { name: '姜末', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['豆腐切块，焯水去豆腥', '姜末炒香，下蟹肉炒散', '放豆腐，加水淀粉勾薄芡，撒葱花'], 'shrimpCrab'),

    '26|dinner|1': d('蛤蜊冬瓜汤', [
      { name: '蛤蜊', amount: '150g' }, { name: '冬瓜', amount: '100g' },
      { name: '姜片', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['蛤蜊吐沙洗净', '冬瓜片煮到透明', '下蛤蜊开口就关火，撒葱花'], 'shellfish'),

    '27|dinner|0': d('虾仁菌菇汤', [
      { name: '虾仁', amount: '60g' }, { name: '香菇', amount: '30g' },
      { name: '金针菇', amount: '50g' }, { name: '姜丝', amount: '5g' }, { name: '葱花', amount: '5g' }
    ], ['菌菇撕小朵煮 5 分钟', '下虾仁煮到变色', '撒葱花，滴两滴香油'], 'shrimpCrab'),
  };

  // 藻类过敏时的替代（这几道菜本身就是藻类撑起来的，去掉就没菜了）
  const ALGAE = {
    '7|dinner|1': d('番茄蛋花汤', [
      { name: '番茄', amount: '80g' }, { name: '鸡蛋', amount: '1个' }, { name: '葱花', amount: '5g' }
    ], ['番茄切块炒出沙，加水煮开', '淋入蛋液', '撒葱花'], 'none'),
    '9|dinner|1': d('菠菜蛋花汤', [
      { name: '菠菜', amount: '60g' }, { name: '鸡蛋', amount: '1个' }, { name: '葱花', amount: '5g' }
    ], ['菠菜焯水去草酸，切段', '水开下菠菜，淋入蛋液', '撒葱花'], 'none'),
    '24|dinner|1': d('凉拌木耳', [
      { name: '木耳', amount: '50g' }, { name: '蒜末', amount: '5g' },
      { name: '生抽', amount: '5ml' }, { name: '香醋', amount: '5ml' }
    ], ['木耳泡发后焯水 2 分钟', '过凉水沥干', '蒜末生抽香醋拌匀'], 'none'),
    '26|lunch|1': d('冬瓜粉丝汤', [
      { name: '冬瓜', amount: '100g' }, { name: '粉丝', amount: '20g' }, { name: '葱花', amount: '5g' }
    ], ['冬瓜切薄片煮软', '下泡软的粉丝煮 2 分钟', '撒葱花'], 'none'),
  };

  /* 过敏原识别。只认明确的词，不用裸「鱼」——淡水鱼不算海鱼。 */
  const RULES = {
    seaFish: /(带鱼|黄鱼|鲳鱼|三文鱼|鳕鱼|鲅鱼|沙丁|金枪|秋刀|多宝|海鲈|石斑|比目|鲽鱼|鲭鱼|鳗鱼|海鳗|银鳕|鱼籽|鱼子)/,
    shrimpCrab: /(虾滑|虾仁|虾皮|虾米|对虾|基围虾|河虾|龙虾|皮皮虾|虾丸|虾|蟹肉|蟹粉|螃蟹|梭子蟹|大闸蟹|蟹棒|蟹黄)/,
    shellfish: /(花蛤|蛤蜊|文蛤|蛤|扇贝|干贝|瑶柱|生蚝|牡蛎|蚝油|鲍鱼|蛏子|蚬|花甲|贝肉|青口)/,
    algae: /(海带|紫菜|裙带菜|海苔|羊栖菜|螺旋藻)/,
  };
  // 海鱼里带「鱼」的名字，用于把淡水鱼排除在外做二次确认
  const FRESH = /(草鱼|鲫鱼|鳜鱼|黑鱼|昂刺|鲤鱼|鲢鱼|鳙鱼|罗非|鲶鱼|鳊鱼|银鱼|黄颡|鱼丸|草鱼丸)/;

  const LABEL = { seaFish: '海鱼', shrimpCrab: '虾蟹', shellfish: '贝类', algae: '藻类' };

  return { SWAP, ALGAE, RULES, FRESH, LABEL };
})();
