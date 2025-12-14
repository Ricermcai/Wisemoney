import { AppData } from '@/types';

/**
 * 核心数据文件 (Master Data File)
 * 
 * 用户的个人历史数据备份。
 * 导出时间: 2025/12/15 02:40:14
 */

export const INITIAL_DATA: AppData = {
  "version": 2,
  "timestamp": 1765737270493,
  "ledger": {
    "freedomFund": 22779,
    "dreamFund": 10223,
    "playFund": 2332.17,
    "transactions": [
      {
        "id": "1765737270489-1",
        "amount": 4756,
        "fundType": "FREEDOM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765737270489
      },
      {
        "id": "1765737270489-2",
        "amount": 3805,
        "fundType": "DREAM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765737270489
      },
      {
        "id": "1765737270489-3",
        "amount": 950.73,
        "fundType": "PLAY",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765737270489
      },
      {
        "id": "1765736232361",
        "amount": 223.8,
        "fundType": "PLAY",
        "type": "WITHDRAWAL",
        "description": "抖音购买秋裤内搭上衣",
        "date": 1765736232361
      },
      {
        "id": "1765736168796-1",
        "amount": 1273,
        "fundType": "FREEDOM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736168796
      },
      {
        "id": "1765736168796-2",
        "amount": 1018,
        "fundType": "DREAM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736168796
      },
      {
        "id": "1765736168796-3",
        "amount": 255.24,
        "fundType": "PLAY",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736168796
      },
      {
        "id": "1765736139468-1",
        "amount": 6000,
        "fundType": "FREEDOM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736139468
      },
      {
        "id": "1765736139468-2",
        "amount": 4800,
        "fundType": "DREAM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736139468
      },
      {
        "id": "1765736139468-3",
        "amount": 1200,
        "fundType": "PLAY",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736139468
      },
      {
        "id": "1765736101718-1",
        "amount": 750,
        "fundType": "FREEDOM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736101718
      },
      {
        "id": "1765736101718-2",
        "amount": 600,
        "fundType": "DREAM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736101718
      },
      {
        "id": "1765736101718-3",
        "amount": 150,
        "fundType": "PLAY",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765736101718
      },
      {
        "id": "1765735851492-1",
        "amount": 10000,
        "fundType": "FREEDOM",
        "type": "DEPOSIT",
        "description": "收入分配",
        "date": 1765735851492
      }
    ],
    "dreamGoals": [
      {
        "id": "1765736098846",
        "name": "跨年旅游",
        "cost": 3000,
        "isAchieved": false
      }
    ],
    "percentages": {
      "freedom": 50,
      "dream": 40,
      "play": 10
    }
  },
  "journal": [
    {
      "id": "1765725542522",
      "timestamp": 1765725542522,
      "items": [
        "我今天完成了diffusion policy的效果验证，效果还不错，有能完成任务的趋势，夹取到物体后会去找应该插入的孔",
        "我部署了gemini账号pro",
        "我完成了特聘教授ppt制作，没有拖延",
        "我跟学弟联络沟通了，后续学弟会加入能够帮助到我许多",
        "我能够为了我的梦想付诸行动和充满动力:我更新改进了我的wisedream软件"
      ]
    },
    {
      "id": "history-2025-12-10",
      "timestamp": 1765296000000,
      "items": [
        "训练task2 act",
        "纳入啦新的成员 为我的队伍壮大力量！并且布置啦学习任务",
        "把ppt的排版工作 交给了外包，把自己的时间留给更重要的事情",
        "写好了ppt的基础大纲标题框架，",
        "积极沟通 积极解决 ，快速解决了版面费经费卡问题，感恩胡老师 侯老师 路老师🥹的经费支持。",
        "保持在行业内，获得行业最前沿的信息，并积累自己的投资资本，关注最值得投资的行业和项目。"
      ]
    },
    {
      "id": "history-2025-12-09",
      "timestamp": 1765209600000,
      "items": [
        "完成了diffusion 增加验证集损失 保存最佳epoch，并试验检验出了num_work 和batch的最优配比32 32",
        "公司这边继续实习",
        "和朋友交流感情 学习新想法",
        "和朱哥再一次通行，执行力拉满 获得一个创客基地办公地",
        "勇敢在xhs和具身领域大佬 许华哲Harry进行了交流和请教！他人很好对我的问题进行了认真的解答。"
      ]
    },
    {
      "id": "history-2025-12-05",
      "timestamp": 1764864000000,
      "items": [
        "完成啦博士开题报告的撰写，并重新整理了未来的论文计划",
        "跟国创老师讨论了国创大赛后续的方向",
        "见了耀行科技的创始人，了解沟通了研究进展和现状，并被邀请加入当联合创始人",
        "跟师妹开了组会，传承了之前的代码，并为她布置后续两周的学习进度安排",
        "沉下心，继续学习完了之前没看完的MoE的内容"
      ]
    },
    {
      "id": "history-2025-12-04",
      "timestamp": 1764777600000,
      "items": [
        "我今天通过自己用仿真，观察之前的训练结果，结合这段时间的所见所闻，同时结合对相同反复出现的数字的敏感性，弄清楚了训练的steps ，epoch，和frame 以及fps之间的关系，并制定了收敛的steps数，小数据集单一任务应该按照epoch来。",
        "跑通了kdc挑战的 smolvla策略模型，训练上了task1",
        "跟朋友联络了感情，交流了近况",
        "帮助了之前帮助了我的人",
        "找到了lerobot官方的一个bug，并提交了一个issue提供了解决方案"
      ]
    },
    {
      "id": "history-2025-12-03",
      "timestamp": 1764691200000,
      "items": [
        "今天按时早起啦",
        "今天一天都保持平和的心情和心态，没有产生焦虑",
        "今天团建结束，回来后坚持按计划完成啦开题报告的任务",
        "今天计划了未来两周的工作",
        "今天玩游戏，我的反应很快，还为团队赢得了一分"
      ]
    },
    {
      "id": "history-2025-12-02",
      "timestamp": 1764604800000,
      "items": [
        "今天阅读了1h的书籍小狗钱钱，并立马行动构建了自己的财务自由基金，梦想成真基金，乐享生活基金",
        "我还马上利用AI studio工具，帮我构建了一个记录以上实践功能的app，包含三种基金的账本和成功日记功能",
        "我今天还完成了博士开题word的具体内容，三个内容的初版，明天接着将内容中的具体技术路线独立出来就好",
        "我今天全天都充满了积极乐观的情绪，对未来充满了希望，没有任何的消极和悲观情绪，维持了良好的身心健康",
        "我今天还详细计划了制作短视频分享我的读后感，和公开分享我的app的机会，同时构建了后续的粉丝粘性计划，构建梦想成真交流群，关注进群，免费分享app，然后同时定期开直播，监督检查群友们分享交流他们的实践进度"
      ]
    }
  ]
};
