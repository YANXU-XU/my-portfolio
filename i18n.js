// Shared bilingual UI copy for the five public pages.
// Every entry is [简体中文, English]. Internal ids and data stay untouched.
(() => {
  const STORAGE_KEY = 'stickman-motion-language';
  const DEFAULT_LANGUAGE = 'zh-CN';
  const SUPPORTED_LANGUAGES = new Set(['zh-CN', 'en']);

  const MESSAGES = {
    // Shared chrome.
    'common.skip': ['跳至主要内容', 'Skip to content'],
    'common.brandHome': ['Stickman Motion Simulator 首页', 'Stickman Motion Simulator home'],
    'common.primaryNav': ['主导航', 'Primary navigation'],
    'common.language': ['界面语言', 'Language'],
    'common.switchToChinese': ['切换到简体中文', 'Switch to Simplified Chinese'],
    'common.switchToEnglish': ['切换到英文', 'Switch to English'],
    'common.nav.home': ['首页', 'Home'],
    'common.nav.simulator': ['动作游戏', 'Simulator'],
    'common.nav.gallery': ['动作画廊', 'Gallery'],
    'common.nav.animator': ['动画编辑器', 'Animator'],
    'common.nav.about': ['关于', 'About'],
    'common.soundOn': ['声音开启', 'Sound on'],
    'common.soundOff': ['声音关闭', 'Sound off'],
    'common.playMotion': ['播放动作', 'Play motion'],
    'common.pauseMotion': ['暂停动作', 'Pause motion'],
    'common.copyright': ['© 2026 Stickman Motion Simulator', '© 2026 Stickman Motion Simulator'],
    'common.footer.home': ['一个学生制作的 HTML · CSS · SVG · JavaScript 视觉实验。', 'A student-made visual experiment in HTML · CSS · SVG · JavaScript.'],
    'common.footer.simulator': ['轻轻移动，仔细观察。', 'Move lightly. Observe closely.'],
    'common.footer.gallery': ['小形状也能讲大故事。', 'Small shapes can tell big stories.'],
    'common.footer.animator': ['小形状，认真的节奏。', 'Small shapes, serious rhythm.'],
    'common.footer.about': ['让想法保持流动。', 'Keep your ideas in motion.'],

    // Page metadata.
    'meta.home.title': ['Stickman Motion Simulator | 首页', 'Stickman Motion Simulator | Home'],
    'meta.home.description': ['一个明亮、俏皮的首页，探索火柴人的动作。', 'A bright, playful home for exploring stickman movement.'],
    'meta.home.ogTitle': ['Stickman Motion Simulator', 'Stickman Motion Simulator'],
    'meta.home.ogDescription': ['通过明快的色块肖像和俏皮的动作研究探索运动。', 'Explore movement through bright color-block portraits and playful motion studies.'],
    'meta.simulator.title': ['复现动作 | Stickman Motion Simulator', 'Echo the Moves | Stickman Motion Simulator'],
    'meta.simulator.description': ['玩动作回声：观看一段火柴人动作组合，再用七个数字键复现它。', 'Play Motion Echo: watch a short stickman motion sequence, then repeat it with seven numbered move keys.'],
    'meta.simulator.ogTitle': ['动作回声 | Stickman Motion Simulator', 'Motion Echo | Stickman Motion Simulator'],
    'meta.simulator.ogDescription': ['观看一段简短的火柴人动作组合，再用七个数字键复现它。', 'Watch a short stickman motion phrase, then repeat it with seven numbered move keys.'],
    'meta.gallery.title': ['动作画廊 | Stickman Motion Simulator', 'Gallery | Stickman Motion Simulator'],
    'meta.gallery.description': ['在动作画廊中浏览七种色块火柴人动作。', 'Browse seven color-block stickman motions in the motion gallery.'],
    'meta.gallery.ogTitle': ['动作画廊 | Stickman Motion Simulator', 'Motion Gallery | Stickman Motion Simulator'],
    'meta.gallery.ogDescription': ['七种明亮色块火柴人动作的视觉目录。', 'A visual catalog of seven bright color-block stickman motions.'],
    'meta.animator.title': ['动画编辑器 | Stickman Motion Simulator', 'Animator | Stickman Motion Simulator'],
    'meta.animator.description': ['为关节相连的 SVG 火柴人骨架摆姿势并制作动画。', 'Pose and animate a connected SVG stickman skeleton.'],
    'meta.about.title': ['关于 | Stickman Motion Simulator', 'About | Stickman Motion Simulator'],
    'meta.about.description': ['了解 Stickman Motion Simulator 如何把七种俏皮动作变成互动动作研究。', 'Learn how Stickman Motion Simulator turns seven playful movements into an interactive motion study.'],
    'meta.about.ogTitle': ['关于 | Stickman Motion Simulator', 'About | Stickman Motion Simulator'],
    'meta.about.ogDescription': ['发现七种俏皮火柴人动作背后的运动理念。', 'Discover the movement ideas behind seven playful stickman actions.'],

    // Home.
    'home.kicker': ['Stickman Motion · 一座微型动作博物馆', 'Stickman Motion · A tiny movement museum'],
    'home.title': ['找到你的<br><span>有趣走法。</span>', 'Find your<br><span>funny walk.</span>'],
    'home.lede': ['一场关于平衡、节奏，以及那些让姿势变成个性的小小选择的明亮研究。走进实验室，浏览姿势，或亲手转动骨架。', 'A bright study of balance, rhythm, and the small choices that turn a pose into a personality. Step into the lab, browse the poses, or take the rig for a spin.'],
    'home.trySimulator': ['试试动作游戏', 'Try the simulator'],
    'home.meetRig': ['认识骨架', 'Meet the rig'],
    'home.statsAria': ['项目数据', 'Project facts'],
    'home.stats.motions': ['种动作', 'motions'],
    'home.stats.body': ['副身体', 'body'],
    'home.stats.rhythms': ['种节奏', 'rhythms'],
    'home.stage.index': ['肖像 / 01', 'Portrait / 01'],
    'home.stage.counter': ['07 种动作 · 01 副身体', '07 motions · 01 body'],
    'home.portrait.label': ['你好，动作玩家！', 'Hello, mover!'],
    'home.portrait.aria': ['改变肖像的心情', "Change the portrait's mood"],
    'home.portrait.title': ['一张明快的色块肖像', 'A bright color-block portrait'],
    'home.portrait.desc': ['一张由钴蓝、番茄红、橙色、绿色和紫色形状组成的俏皮面孔。', 'A playful head made from cobalt blue, tomato red, orange, green, and purple shapes.'],
    'home.dialogue.label': ['动作旁白', 'VOICE NOTE'],
    'home.dialogue.initial': ['每个身体都有自己的节奏。', 'Every body has a rhythm.'],
    'home.dialogue.changeMood': ['换种心情', 'Change mood'],
    'home.dialogue.changeMoodAria': ['改变肖像心情', 'Change portrait mood'],
    'home.notesAria': ['现场笔记', 'Field notes'],
    'home.notes.what': ['这是什么？', 'What is this?'],
    'home.notes.how': ['怎么玩？', 'How to play?'],
    'home.notes.whatMessage': ['六个简单姿势，无数小故事。', 'Six simple poses. Infinite little stories.'],
    'home.notes.howMessage': ['点一个姿势，看它变化，让网页活起来。', 'Click a pose, watch it change, and make the web feel alive.'],
    'home.stage.help': ['点击肖像，改变它的心情。', 'Click the portrait to change its mood.'],
    'home.explore.eyebrow': ['选一个房间', 'Choose a room'],
    'home.explore.title': ['四种进入动作的方式。', 'Four ways into the motion.'],
    'home.explore.desc': ['玩一个姿势，研究动作词汇，搭建骨架，或读读项目背后的笔记。', 'Play with a pose, study the vocabulary, build a rig, or read the notes behind the project.'],
    'home.routesAria': ['探索项目', 'Explore the project'],
    'home.routes.simulator.index': ['01 / 玩', '01 / Play'],
    'home.routes.simulator.title': ['动作游戏', 'Simulator'],
    'home.routes.simulator.copy': ['切换姿势，看身体找到新的节奏。', 'Switch poses and watch the body find a new rhythm.'],
    'home.routes.gallery.index': ['02 / 浏览', '02 / Browse'],
    'home.routes.gallery.title': ['动作画廊', 'Gallery'],
    'home.routes.gallery.copy': ['七种姿势，一套明亮的视觉词汇。', 'Seven poses, one bright visual vocabulary.'],
    'home.routes.animator.index': ['03 / 摆姿势', '03 / Pose'],
    'home.routes.animator.title': ['动画编辑器', 'Animator'],
    'home.routes.animator.copy': ['抓住一个关节，搭建侧视动作研究。', 'Grab a joint and build a side-view movement study.'],
    'home.routes.about.index': ['04 / 阅读', '04 / Read'],
    'home.routes.about.title': ['项目', 'The project'],
    'home.routes.about.copy': ['动作背后的想法、限制和小实验。', 'The ideas, constraints, and small experiments behind the motion.'],
    'home.index.eyebrow': ['动作词汇', 'Movement vocabulary'],
    'home.index.title': ['七种移动方式。', 'Seven ways to move.'],
    'home.index.desc': ['每个姿势都是关于平衡的小决定。直接跳到画廊里的一个吧。', 'Every pose is a small decision about balance. Jump straight to one in the gallery.'],
    'home.mood.happy': ['轻轻一弹，也能闪亮登场。', 'A little bounce makes a big entrance.'],
    'home.mood.surprised': ['哦！你找到了隐藏的心情按钮。', 'Oh! You found the hidden mood button.'],
    'home.mood.sleepy': ['再爱动的人，也需要打个盹。', 'Even movers need a tiny pause.'],

    // Motion names, descriptions, and home voice notes.
    'motions.stand.label': ['站立', 'Stand'],
    'motions.stand.cardTitle': ['站立', 'Standing'],
    'motions.stand.description': ['沉稳的起点，重心均匀而平静。', 'A grounded starting point with calm, even weight.'],
    'motions.stand.dialogue': ['就站在这儿，欣赏一下艺术。', 'Just hanging around, admiring the art.'],
    'motions.stand.aria': ['站立的火柴人', 'Standing stickman'],
    'motions.walk.label': ['行走', 'Walk'],
    'motions.walk.cardTitle': ['行走', 'Walking'],
    'motions.walk.description': ['对侧手臂与腿配合，形成稳定的前进节奏。', 'Opposite arms and legs suggest a steady forward rhythm.'],
    'motions.walk.dialogue': ['慢慢逛过画廊。', 'Strolling slowly through the gallery.'],
    'motions.walk.aria': ['行走的火柴人', 'Walking stickman'],
    'motions.run.label': ['奔跑', 'Run'],
    'motions.run.cardTitle': ['奔跑', 'Running'],
    'motions.run.description': ['更长的步幅和张开的手臂表现冲劲。', 'A longer stride and open arms capture momentum.'],
    'motions.run.dialogue': ['快点！好戏要结束了。', 'Hurry! The good show is about to end.'],
    'motions.run.aria': ['奔跑的火柴人', 'Running stickman'],
    'motions.jump.label': ['跳跃', 'Jump'],
    'motions.jump.cardTitle': ['跳跃', 'Jumping'],
    'motions.jump.description': ['抬起的四肢让安静的姿势也充满能量。', 'Lifted limbs make a quiet pose feel full of energy.'],
    'motions.jump.dialogue': ['这幅作品让我想跳起来！', 'This artwork makes me want to jump!'],
    'motions.jump.aria': ['跳跃的火柴人', 'Jumping stickman'],
    'motions.wave.label': ['挥手', 'Wave'],
    'motions.wave.cardTitle': ['挥手', 'Waving'],
    'motions.wave.description': ['一只举起的手，让简单剪影变成问候。', 'A raised hand turns a simple silhouette into a greeting.'],
    'motions.wave.dialogue': ['你好呀，同好。', 'Hello there, fellow art lover.'],
    'motions.wave.aria': ['挥手的火柴人', 'Waving stickman'],
    'motions.squat.label': ['下蹲', 'Squat'],
    'motions.squat.cardTitle': ['下蹲', 'Squatting'],
    'motions.squat.description': ['更低的重心会改变整个人的气质。', 'A lower center of gravity changes the whole character.'],
    'motions.squat.dialogue': ['蹲下来看看这些小细节。', 'Getting down to check the tiny details.'],
    'motions.squat.aria': ['下蹲的火柴人', 'Squatting stickman'],
    'motions.swim.label': ['游泳', 'Swim'],
    'motions.swim.cardTitle': ['游泳', 'Swimming'],
    'motions.swim.description': ['一个侧身扑腾，逃离又一场艺术长谈。', 'A sideways splash for escaping one more art talk.'],
    'motions.swim.dialogue': ['潜走，躲开太多艺术讲座。', 'Diving away from too many art talks.'],
    'motions.swim.aria': ['游泳的火柴人', 'Swimming stickman'],
    'motions.simAria': ['火柴人正在做“{motion}”', 'Stickman performing {motion}'],

    // Gallery.
    'gallery.eyebrow': ['动作画廊', 'The motion gallery'],
    'gallery.title': ['七个姿势，一种俏皮语言。', 'Seven poses, one playful language.'],
    'gallery.lede': ['每个姿势都由一个头部和几块明亮的几何形状组成。它们一起构成一套简单的视觉词汇。', 'Each pose uses a head and a few bright geometric shapes. Together they create a simple visual vocabulary.'],
    'gallery.gridAria': ['七种火柴人动作', 'Seven stickman motions'],

    // Simulator / Motion Echo.
    'simulator.eyebrow': ['动作游乐场 · 回声', 'Motion playground · Echo'],
    'simulator.title': ['你能复现这些动作吗？', 'Can you echo the moves?'],
    'simulator.lede': ['观看一段简短的动作组合，然后用七个数字键复现它。每过一轮，就多一个动作。', 'Watch a short motion phrase, then repeat it with the seven numbered move keys. Every round adds one more move.'],
    'simulator.gameAria': ['动作回声游戏', 'Motion Echo game'],
    'simulator.hudAria': ['游戏状态', 'Game status'],
    'simulator.round': ['轮次', 'Round'],
    'simulator.score': ['得分', 'Score'],
    'simulator.lives': ['生命', 'Lives'],
    'simulator.livesAria': ['剩余 {count} 条生命', '{count} {unit} left'],
    'simulator.lifeOne': ['生命', 'life'],
    'simulator.lifeMany': ['生命', 'lives'],
    'simulator.restart': ['重新开始', 'Restart'],
    'simulator.stageLabel': ['记忆舞台', 'Memory stage'],
    'simulator.state.idle': ['准备', 'Ready'],
    'simulator.state.watching': ['观看', 'Watch'],
    'simulator.state.input': ['轮到你了', 'Your turn'],
    'simulator.state.clear': ['完成', 'Clear'],
    'simulator.state.over': ['游戏结束', 'Game over'],
    'simulator.state.victory': ['胜利', 'Victory'],
    'simulator.caption.initial': ['看舞台，然后复现动作。', 'Watch the stage, then repeat the phrase.'],
    'simulator.sidebar.eyebrow': ['你的任务', 'Your mission'],
    'simulator.sidebar.title': ['看。记住。复现。', 'Watch. Remember. Repeat.'],
    'simulator.howto': ['玩法', 'How to play'],
    'simulator.steps.watch': ['<strong>观看</strong>一段简短的动作组合。', '<strong>Watch</strong> a short motion phrase.'],
    'simulator.steps.repeat': ['用七个数字键<strong>复现</strong>它。', '<strong>Repeat</strong> it with the seven numbered keys.'],
    'simulator.steps.keep': ['<strong>继续</strong>五轮。错过三次，游戏结束。', '<strong>Keep going</strong> for five rounds. Three misses end the run.'],
    'simulator.message.ready': ['准备好后，按“开始游戏”。', 'Press Start game when you are ready.'],
    'simulator.message.missingData': ['动作数据没有加载。请刷新页面。', 'The motion data did not load. Refresh the page.'],
    'simulator.progress.none': ['尚未输入动作', 'No moves entered'],
    'simulator.progress.watching': ['正在观看 {length} 个动作', 'Watching {length} moves'],
    'simulator.progress.watchingMove': ['正在观看第 {filled} 个，共 {length} 个动作', 'Watching move {filled} of {length}'],
    'simulator.progress.repeated': ['已复现 {filled} / {length} 个动作', '{filled} of {length} moves repeated'],
    'simulator.actions.start': ['开始游戏', 'Start game'],
    'simulator.actions.next': ['下一轮', 'Next round'],
    'simulator.actions.playAgain': ['再玩一次', 'Play again'],
    'simulator.actions.replay': ['再看一次', 'Watch again'],
    'simulator.keypad.headRepeat': ['用这些键复现', 'Repeat with'],
    'simulator.keypad.keys': ['数字键 1–7', 'Keys 1–7'],
    'simulator.keypad.label': ['七个动作键', 'Seven motion keys'],
    'simulator.key.aria': ['动作 {number}：{motion}', 'Move {number}: {motion}'],
    'simulator.shortcut.html': ['<span aria-hidden="true">⌨</span> 组合结束后，按 <kbd>1</kbd> 到 <kbd>7</kbd>。也可以点击或触摸。', '<span aria-hidden="true">⌨</span> Press <kbd>1</kbd> to <kbd>7</kbd> after the phrase ends. Touch and click work too.'],
    'simulator.caption.watchCount': ['观看 {count} 个动作。', 'Watch {count} moves.'],
    'simulator.caption.watchMove': ['观看第 {index} 个，共 {total} 个动作。', 'Watch move {index} of {total}.'],
    'simulator.caption.yourTurn': ['轮到你了：复现 {count} 个动作。', 'Your turn: repeat {count} moves.'],
    'simulator.caption.watchClosely': ['看仔细，动作组合要开始了。', 'Watch closely. The phrase is about to begin.'],
    'simulator.caption.good': ['很好——{cursor} / {total}。', 'Good — {cursor} of {total}.'],
    'simulator.caption.notQuite': ['不对——{pressed} 不是下一个动作。', 'Not quite — {pressed} was not the next move.'],
    'simulator.caption.roundClear': ['第 {round} 轮完成。', 'Round {round} clear.'],
    'simulator.caption.victory': ['五轮全部复现。', 'All five rounds echoed.'],
    'simulator.caption.gameOver': ['本轮结束于第 {round} 轮。', 'The run ends in round {round}.'],
    'simulator.message.round': ['第 {round} 轮：观看 {count} 个动作。', 'Round {round}: watch {count} moves.'],
    'simulator.message.yourTurn': ['轮到你了——从头复现全部 {count} 个动作。', 'Your turn — repeat all {count} moves from the start.'],
    'simulator.message.replay': ['再看一遍同样的组合。不会损失机会。', 'Watching the same phrase again. No try is lost.'],
    'simulator.message.good': ['很好——{motion}。还剩 {remaining} {unit}。', 'Good — {motion}. {remaining} {unit} to go.'],
    'simulator.message.wrong': ['不对——你按了 {pressed}。第 {step} 步应是 {expected}。序列已重置：再看一遍，或从头试。', 'Not quite — you pressed {pressed}. At step {step}, the phrase was {expected}. The sequence is reset: watch again or try from the start.'],
    'simulator.message.roundClear': ['第 {round} 轮完成。+{points} 分。喘口气，然后选择“下一轮”。', 'Round {round} clear. +{points} points. Take a breath, then choose Next round.'],
    'simulator.message.victory': ['第 5 轮完成。+{points} 分。最终得分：{score}。你复现了每一段动作。', 'Round 5 clear. +{points} points. Final score: {score}. You echoed every phrase.'],
    'simulator.message.gameOver': ['游戏结束——最终得分 {score}。你到达第 {round} 轮，共 {total} 轮。', 'Game over — final score {score}. You reached round {round} of {total}.'],
    'simulator.detail.lastInput': ['最后一次输入是 {pressed}；正确动作是 {expected}。', 'The last input was {pressed}; the phrase needed {expected}.'],
    'simulator.unit.move': ['步', 'move'],
    'simulator.unit.moves': ['步', 'moves'],

    // Animator.
    'animator.eyebrow': ['关节骨骼工作室', 'Connected skeleton studio'],
    'animator.title': ['摆出真实的骨架。', 'Pose a real skeleton.'],
    'animator.lede': ['每个肢体都锚定在关节上。选择一个部位，改变角度，或播放动作预设。', 'Every limb is anchored to a joint. Select a segment, change its angle, or play a movement preset.'],
    'animator.workspaceAria': ['火柴人动画编辑器', 'Stickman animator'],
    'animator.rigLabel': ['侧视骨骼', 'SIDE-VIEW RIG'],
    'animator.svg.title': ['关节相连的火柴人骨架', 'Connected stickman skeleton'],
    'animator.svg.desc': ['以髋部为根部的侧视骨架，可选择头部、躯干、上臂、前臂、大腿和小腿。双脚由双骨骼 IK 定位。', 'A hip-rooted side-view skeleton with selectable head, torso, upper limbs, forearms, thighs, and shins. Feet are positioned by two-bone IK.'],
    'animator.instruction': ['选择部位 · 拖动或使用角度控制', 'Select a segment · drag or use the angle control'],
    'animator.reset': ['重置姿势', 'Reset pose'],
    'animator.play': ['▶ 播放预设', '▶ Play preset'],
    'animator.stop': ['■ 停止', '■ Stop'],
    'animator.speed': ['速度', 'Speed'],
    'animator.speed.slow': ['慢', 'Slow'],
    'animator.speed.balanced': ['标准', 'Balanced'],
    'animator.speed.fast': ['快', 'Fast'],
    'animator.presets': ['预设', 'Presets'],
    'animator.preset.loop': ['循环', 'Loop'],
    'animator.preset.once': ['单次', 'Once'],
    'animator.selected': ['选中部位', 'Selected segment'],
    'animator.rotation': ['旋转', 'Rotation'],
    'animator.partPickerAria': ['选择一个身体部位', 'Select a body segment'],
    'animator.partsHint': ['各部位在肘、膝、肩和髋处保持连接。父级部位会带动相连的子部位。', 'Segments stay attached at the elbow, knee, shoulder, and hip. A parent segment carries its connected child.'],
    'animator.export': ['导出姿势 JSON', 'Export pose JSON'],
    'animator.export.ready': ['关节骨骼数据 · v5', 'Connected skeleton data · v5'],
    'animator.export.done': ['已导出侧视骨骼 JSON · v5', 'Exported side-view skeleton JSON · v5'],
    'animator.partAria': ['{part}部位', '{part} segment'],
    'animator.parts.torso': ['躯干', 'Torso'],
    'animator.parts.head': ['头部', 'Head'],
    'animator.parts.left-upper-arm': ['左上臂', 'Left Upper Arm'],
    'animator.parts.left-forearm': ['左前臂', 'Left Forearm'],
    'animator.parts.right-upper-arm': ['右上臂', 'Right Upper Arm'],
    'animator.parts.right-forearm': ['右前臂', 'Right Forearm'],
    'animator.parts.left-thigh': ['左大腿', 'Left Thigh'],
    'animator.parts.left-shin': ['左小腿', 'Left Shin'],
    'animator.parts.right-thigh': ['右大腿', 'Right Thigh'],
    'animator.parts.right-shin': ['右小腿', 'Right Shin'],
    'animator.status.readySelected': ['准备就绪 · 已选中{part}', 'Ready · {part} selected'],
    'animator.status.playing': ['{preset}预设 · 播放中 · {playback}', '{preset} preset · playing · {playback}'],
    'animator.status.finished': ['{preset}预设 · 已结束', '{preset} preset · finished'],
    'animator.status.manual': ['手动姿势 · {part}', 'Manual pose · {part}'],
    'animator.status.paused': ['{preset}预设 · 已暂停', '{preset} preset · paused'],
    'animator.playback.loop': ['循环', 'loop'],
    'animator.playback.once': ['单次', 'once'],
    'animator.resetInitial': ['重置到初始姿势', 'Reset to initial pose'],
    'animator.edit.historyAria': ['撤销与重做', 'Undo and redo'],
    'animator.edit.undo': ['↶ 撤销', '↶ Undo'],
    'animator.edit.redo': ['↷ 重做', '↷ Redo'],
    'animator.edit.undoHint': ['撤销上一次姿势调整', 'Undo the last pose change'],
    'animator.edit.redoHint': ['重做被撤销的姿势调整', 'Redo the undone pose change'],
    'animator.status.replay': ['回放「{name}」', 'Replaying “{name}”'],
    'animator.status.replayEnded': ['「{name}」回放结束', '“{name}” playback finished'],
    'animator.status.recording': ['录制中 · {time}', 'Recording · {time}'],
    'animator.rec.eyebrow': ['实时录制', 'Live recording'],
    'animator.rec.title': ['录下你的动作', 'Record your movement'],
    'animator.rec.lede': ['按下录制，然后像平时一样拖动关节或播放预设。系统会以每秒约 30 帧记录完整骨骼姿势；暂停期间的调整不会进入录制。', 'Press record, then drag joints or play a preset as usual. The rig is sampled at about 30 frames per second; adjustments made while paused are not recorded.'],
    'animator.rec.transportAria': ['录制与回放控制', 'Recording and playback controls'],
    'animator.rec.record': ['● 录制', '● Record'],
    'animator.rec.pauseRecord': ['❙❙ 暂停录制', '❙❙ Pause rec.'],
    'animator.rec.resumeRecord': ['▶ 继续录制', '▶ Resume rec.'],
    'animator.rec.stop': ['■ 停止录制', '■ Stop rec.'],
    'animator.rec.stopPlay': ['■ 停止回放', '■ Stop playback'],
    'animator.rec.play': ['▶ 播放录制', '▶ Play recording'],
    'animator.rec.pausePlay': ['❙❙ 暂停回放', '❙❙ Pause playback'],
    'animator.rec.resumePlay': ['▶ 继续回放', '▶ Resume playback'],
    'animator.rec.replay': ['↺ 重新播放', '↺ Replay'],
    'animator.rec.save': ['保存录制', 'Save recording'],
    'animator.rec.nameLabel': ['录制名称', 'Recording name'],
    'animator.rec.namePlaceholder': ['例如：挥手致意', 'e.g. Wave hello'],
    'animator.rec.state.idle': ['空闲', 'Idle'],
    'animator.rec.state.recording': ['录制中', 'Recording'],
    'animator.rec.state.paused': ['录制已暂停', 'Recording paused'],
    'animator.rec.state.stopped': ['录制完成 · 待保存', 'Recording ready'],
    'animator.rec.state.playing': ['回放中', 'Playing'],
    'animator.rec.state.playPaused': ['回放已暂停', 'Playback paused'],
    'animator.rec.state.playEnded': ['回放结束', 'Playback finished'],
    'animator.rec.started': ['开始录制。拖动关节或播放预设都会被记录下来。', 'Recording started. Drag joints or play a preset — everything is captured.'],
    'animator.rec.pauseNote': ['已暂停：此时的调整不会进入录制。', 'Paused: adjustments made now are not recorded.'],
    'animator.rec.resumed': ['继续录制。', 'Recording resumed.'],
    'animator.rec.ready': ['录制完成 · 时长 {duration}。可播放或保存。', 'Recording ready · {duration}. Play it back or save it.'],
    'animator.rec.empty': ['录制内容为空——没有检测到姿势变化。', 'The recording is empty — no pose change was detected.'],
    'animator.rec.limit': ['已达到最长录制时长，录制已自动停止。', 'Maximum recording length reached; recording stopped automatically.'],
    'animator.rec.saved': ['已保存「{name}」· {duration}。', 'Saved “{name}” · {duration}.'],
    'animator.rec.noTarget': ['还没有可播放的录制。', 'There is no recording to play yet.'],
    'animator.rec.confirmDiscard': ['当前录制尚未保存，继续将丢弃它。', 'The current recording is unsaved and will be discarded.'],
    'animator.rec.deleted': ['已删除录制「{name}」。', 'Deleted “{name}”.'],
    'animator.rec.renamed': ['已重命名为「{name}」。', 'Renamed to “{name}”.'],
    'animator.rec.confirmDelete': ['删除录制「{name}」？此操作不可撤销。', 'Delete the recording “{name}”? This cannot be undone.'],
    'animator.rec.library': ['录制动作', 'Recordings'],
    'animator.rec.libraryAria': ['已保存的录制', 'Saved recordings'],
    'animator.rec.emptyList': ['还没有录制动作。完成一次录制后保存即可。', 'No recordings yet. Finish a take and save it.'],
    'animator.rec.itemMeta': ['{duration} · {date}', '{duration} · {date}'],
    'animator.rec.playItem': ['播放', 'Play'],
    'animator.rec.rename': ['重命名', 'Rename'],
    'animator.rec.delete': ['删除', 'Delete'],
    'animator.rec.renameAria': ['重命名录制', 'Rename recording'],
    'animator.rec.renameSave': ['确定', 'Save'],
    'animator.rec.renameCancel': ['取消', 'Cancel'],
    'animator.rec.renameEmpty': ['请先输入名称。', 'Enter a name first.'],
    'animator.rec.defaultName': ['动作 {n}', 'Recording {n}'],
    'animator.rec.limitCount': ['录制数量已达上限（{limit} 条）。', 'The recording limit ({limit}) was reached.'],
    'animator.rec.count': ['{count} 条', '{count} saved'],
    'animator.pose.library': ['已保存姿势', 'Saved poses'],
    'animator.pose.libraryAria': ['已保存的姿势', 'Saved poses'],
    'animator.pose.nameLabel': ['姿势名称', 'Pose name'],
    'animator.pose.namePlaceholder': ['例如：高举左手', 'e.g. Left arm up'],
    'animator.pose.save': ['保存当前姿势', 'Save current pose'],
    'animator.pose.load': ['载入', 'Load'],
    'animator.pose.delete': ['删除', 'Delete'],
    'animator.pose.saved': ['已保存姿势「{name}」。', 'Saved pose “{name}”.'],
    'animator.pose.loaded': ['已载入姿势「{name}」。', 'Loaded pose “{name}”.'],
    'animator.pose.deleted': ['已删除姿势「{name}」。', 'Deleted pose “{name}”.'],
    'animator.pose.confirmDelete': ['删除姿势「{name}」？此操作不可撤销。', 'Delete the pose “{name}”? This cannot be undone.'],
    'animator.pose.emptyList': ['还没有保存的姿势。', 'No saved poses yet.'],
    'animator.pose.defaultName': ['姿势 {n}', 'Pose {n}'],
    'animator.pose.limitCount': ['姿势数量已达上限（{limit} 条）。', 'The pose limit ({limit}) was reached.'],
    'animator.store.corrupt': ['原有数据无法读取，已备份为 {key}，列表已重置。', 'Stored data could not be read. Backed up as {key}; the list was reset.'],
    'animator.store.quota': ['本地存储空间不足，本次保存未生效。', 'Local storage is full; this save did not apply.'],
    'animator.store.blocked': ['无法备份损坏的数据，已暂停写入以保护原内容。', 'Could not back up the damaged data, so saving is paused to protect it.'],
    'animator.store.unavailable': ['当前环境不可用本地存储，改动仅保存在本次会话。', 'Local storage is unavailable; changes last for this session only.'],

    // About.
    'about.eyebrow': ['关于这项动作研究', 'About the motion study'],
    'about.title': ['七种方式，<br><em>移动与玩耍。</em>', 'Seven ways to<br><em>move and play.</em>'],
    'about.lede': ['Stickman Motion Simulator 把简单的身体位置变成一场明亮、俏皮的动作研究。每个姿势都赋予小角色不同的节奏、方向和态度。', 'Stickman Motion Simulator turns simple body positions into a bright, playful movement study. Each pose gives a tiny character a different rhythm, direction, and attitude.'],
    'about.gridAria': ['动作项目详情', 'Motion project details'],
    'about.panel1.title': ['动作词汇', 'Movement vocabulary'],
    'about.panel1.body': ['站立、行走、奔跑、跳跃、挥手、下蹲和游泳是动作游戏的七个基本动作。它们一起展示平衡与肢体方向的细微变化，如何让动作显得平静、迅速、友好或滑稽。', "Stand, walk, run, jump, wave, squat, and swim are the simulator's seven basic actions. Together they show how small changes in balance and limb direction can make motion feel calm, quick, friendly, or funny."],
    'about.panel1.action': ['编一段节奏', 'Make a rhythm'],
    'about.panel2.title': ['循环中的动作', 'Motion in a loop'],
    'about.panel2.body': ['点击火柴人，发现一个新动作，然后看自动巡览继续走完序列。固定的旁白会随每个姿势变化，让每种动作都有自己的俏皮个性。', 'Click the stickman to discover a new action, then watch the automatic tour continue through the sequence. The fixed voice note changes with every pose, giving each movement its own playful personality.'],
    'about.panel2.action': ['开始循环', 'Start the loop'],
    'about.panel3.title': ['继续移动', 'Keep moving'],
    'about.panel3.body': ['在这个小小动作实验室里，没有完美姿势。试试动作游戏，比较动作画廊，看看几块彩色形状如何暗示一整个运动中的身体。', 'There is no perfect pose in this little motion lab. Try the simulator, compare the action gallery, and notice how a few colorful shapes can suggest a whole body in motion.'],
    'about.panel3.link': ['探索全部七种动作 →', 'Explore all seven movements →'],
    'about.panel3.action': ['给我惊喜', 'Surprise me'],
    'about.action.reset': ['重置这一刻', 'Reset moment'],
    'about.cta.eyebrow': ['迈出下一步', 'Take the next step'],
    'about.cta.title': ['从观看到创造。', 'Move from looking to making.'],
    'about.cta.body': ['打开动作游戏快速摆个姿势，或走进动画编辑器，编出你自己的节奏。', 'Open the simulator for a quick pose, or step into the animator and build a rhythm of your own.'],
    'about.cta.simulator': ['打开动作游戏', 'Open the simulator'],
    'about.cta.animator': ['认识骨架', 'Meet the rig'],
  };

  const root = document.documentElement;
  let currentLanguage = DEFAULT_LANGUAGE;

  function readStoredLanguage() {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return SUPPORTED_LANGUAGES.has(stored) ? stored : DEFAULT_LANGUAGE;
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }
  }

  function storeLanguage(language) {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      // Storage can be unavailable in private or restricted contexts.
    }
  }

  function interpolate(template, params) {
    if (!params) return template;
    return template.replace(/\{(\w+)\}/g, (match, name) => (
      Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
    ));
  }

  function t(key, params, fallback) {
    const entry = MESSAGES[key];
    const value = entry ? entry[currentLanguage === 'en' ? 1 : 0] : '';
    const template = value || fallback || '';
    return interpolate(template, params);
  }

  function getLanguage() {
    return currentLanguage;
  }

  function syncSwitches() {
    document.querySelectorAll('[data-language]').forEach((button) => {
      const isCurrent = button.dataset.language === currentLanguage;
      button.setAttribute('aria-pressed', String(isCurrent));
      button.classList.toggle('is-active', isCurrent);
    });
  }

  function apply(scope = document) {
    scope.querySelectorAll('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (!MESSAGES[key]) return;
      node.textContent = t(key, null, node.textContent);
    });
    scope.querySelectorAll('[data-i18n-html]').forEach((node) => {
      const key = node.dataset.i18nHtml;
      if (!MESSAGES[key]) return;
      node.innerHTML = t(key, null, node.innerHTML);
    });
    scope.querySelectorAll('[data-i18n-aria-label]').forEach((node) => {
      const key = node.dataset.i18nAriaLabel;
      if (!MESSAGES[key]) return;
      node.setAttribute('aria-label', t(key, null, node.getAttribute('aria-label')));
    });
    scope.querySelectorAll('[data-i18n-content]').forEach((node) => {
      const key = node.dataset.i18nContent;
      if (!MESSAGES[key]) return;
      node.setAttribute('content', t(key, null, node.getAttribute('content')));
    });
    scope.querySelectorAll('[data-i18n-title]').forEach((node) => {
      const key = node.dataset.i18nTitle;
      if (!MESSAGES[key]) return;
      node.setAttribute('title', t(key, null, node.getAttribute('title')));
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach((node) => {
      const key = node.dataset.i18nPlaceholder;
      if (!MESSAGES[key]) return;
      node.setAttribute('placeholder', t(key, null, node.getAttribute('placeholder')));
    });
    syncSwitches();
  }

  function finishBoot() {
    try {
      apply();
    } catch (error) {
      // A translation failure must never keep the page hidden.
    } finally {
      root.classList.remove('i18n-booting');
      syncSwitches();
    }
  }

  function setLanguage(language) {
    if (!SUPPORTED_LANGUAGES.has(language)) return;
    currentLanguage = language;
    root.lang = language;
    root.dataset.lang = language;
    storeLanguage(language);
    apply();
    syncSwitches();
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }

  currentLanguage = readStoredLanguage();
  root.lang = currentLanguage;
  root.dataset.lang = currentLanguage;
  root.classList.add('i18n-booting');

  window.StickmanI18n = { t, getLanguage, setLanguage, apply };

  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-language]');
    if (!button) return;
    setLanguage(button.dataset.language);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', finishBoot, { once: true });
  } else {
    finishBoot();
  }

  // CSS reveals the page after 1.2s even if this script never finishes.
  window.setTimeout(() => root.classList.remove('i18n-booting'), 1600);
})();
