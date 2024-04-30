import { segment, plugin, redis } from '#Karin'
import Config from '../lib/config.js'
import DB from '../lib/data.js'

export class FuckSomeone extends plugin {
  constructor () {
    super({
      name: '透',
      dsc: '透一个指定的群友',
      event: 'message',
      priority: 100,
      rule: [
        {
          reg: /^#?透$/,
          fnc: 'fuckOne'
        },
        {
          reg: /^#?透(群友|群主|管理(员)?)$/,
          fnc: 'fuckRandom'
        },
        {
          reg: /^#?(喝补品|锻炼)$/,
          fnc: 'exercise'
        },
        {
          reg: /^#?(我的)?淫荡(指数|值)$/,
          fnc: 'info'
        },
        {
          reg: /^#?群?(淫荡|被透)[排行榜]*$/,
          fnc: 'rank'
        }
      ]
    })
  }

  async fuckRandom (e) {
    /** 当前机器人账号 */
    const botAccount = e.bot.account.uid || e.bot.account.uin
    /** 对象类型 */
    const target_type = e.msg.match(/^#?透(群友|群主|管理(员)?)$/)[1]
    /** 群成员列表 */
    const gml = (await e.bot.GetGroupMemberList({ group_id: e.group_id }))
    /** 排除机器人是群主 */
    if (target_type === '群主' && gml.filter(v => (v.role === 'owner' && v.user_id === botAccount)).length) {
      return await this.reply('那种事情，不可以！', { reply: true })
    }
    /** 筛选符合条件的群友 */
    let target_users = []
    switch (target_type) {
      case '群友':
        target_users.push(...gml.filter(v => (v.role === 'member' && v.user_id !== botAccount)))
      // eslint-disable-next-line no-fallthrough
      case '管理':
      case '管理员':
        target_users.push(...gml.filter(v => v.role === 'admin' && v.user_id !== botAccount))
      // eslint-disable-next-line no-fallthrough
      case '群主':
        target_users.push(...gml.filter(v => v.role === 'owner'))
        break
    }
    if (!target_users.length) {
      return await this.reply('你要透的人被提前拐走了，真是神奇的一幕')
    }
    e.at = [target_users[Math.floor(Math.random() * (target_users.length - 1))].user_id]
    /** 递给fuckOne处理 */
    this.fuckOne(e)
  }

  async fuckOne (e) {
    /** 没有指定群友(包括仅@机器人和@全体成员) */
    if (!e.at.length) {
      if (e.atBot) {
        return await this.reply('那种事情，不要啊！', { reply: true })
      }
      return await this.reply('不知道透谁？那就把屁股撅好准备挨透吧！')
    }
    /** 随机扣除30-100cal体力 */
    const energy_cost = Math.floor(Config.Config.energy_cost_min + Math.random() * (Config.Config.energy_cost_max - Config.Config.energy_cost_min))
    /** 精液量倍数 */
    const cum_rate = 0.05 * Math.floor(1 + Math.random() * 4)
    /** 增加的精液量 */
    const cum_raise = Math.floor(energy_cost * cum_rate)
    /** 获取双方信息(不存在则自动创建) */
    let operator_user = await DB.getUser(e.group_id, e.user_id)
    let target_user = await DB.getUser(e.group_id, e.at[0])
    /** 体力不足 */
    if (operator_user.energy < energy_cost) {
      return await this.reply('杂鱼大叔，你已经是强弩之末啦！\n要我给你搞点补品喝喝吗？', { at: true, recallMsg: Config.Config.recall_delay })
    }
    /** 操作数据 */
    operator_user.energy -= energy_cost
    target_user.cum += Math.floor(energy_cost * cum_rate)
    target_user.cnt++
    operator_user.save()
    target_user.save()
    const target_info = await e.bot.GetGroupMemberInfo({ group_id: e.group_id, target_uin: e.at[0] })
    /** 发送消息 */
    await this.reply([
      segment.text(`透了『${target_info.card || target_info.nickname}』(${e.at[0]})${(cum_rate >= 0.2) ? '，打出了暴击！' : `${(cum_rate <= 0.05) ? '，就一滴也很满足~' : ''}`}\n${cum_raise}mL精液被喂给了他，小小的肚子里容纳了${target_user.cum}mL精液。\n你消耗了${energy_cost}卡路里，还剩${operator_user.energy}卡路里。`),
      segment.image(e.bot.getAvatarUrl(e.at[0], 100))
    ], { at: true, recallMsg: Config.Config.recall_delay })
  }

  async exercise (e) {
    /** redis键名 */
    const cooldown_key = `MakeLove:exercise:cooldown:${e.group_id}:${e.user_id}`
    /** 检查冷却时间 */
    const cooldown_value = await redis.get(cooldown_key)
    if (cooldown_value) return await this.reply(`这么快就不行了啊，你的补品还没产好呢！\n预计需要 ${Math.floor((cooldown_value - Date.now()) / 1000)} 秒...`)
    /** CD储存在redis中 */
    redis.set(cooldown_key, Config.Config.cooldown * 1000 + Date.now(), { EX: Config.Config.cooldown })
    /** 随机增加100-600cal体力 */
    const energy_raise = Math.floor(Config.Config.energy_raise_min + Math.random() * (Config.Config.energy_raise_max - Config.Config.energy_raise_min))
    let user = await DB.getUser(e.group_id, e.user_id)
    user.energy += energy_raise
    await user.save()
    await this.reply(`你吞下了神秘补品，体力恢复了${energy_raise}卡路里。\n还剩${user.energy}卡路里。`, { at: true, recallMsg: Config.Config.recall_delay })
  }

  async info (e) {
    let user = await DB.getUser(e.group_id, e.at[0] || e.user_id)
    await this.reply([
      segment.at(e.at[0] || e.user_id),
      segment.text(`已经被透了${user.cnt}次，凸出的小腹中容纳着惊人的${user.cum}mL精液。真令人叹为观止！\n体力还剩${user.energy}卡路里。`)
    ])
  }

  async rank (e) {
    let users = await DB.User.findAll({
      where: { group_id: e.group_id },
      order: [['cum', 'DESC']],
      limit: Config.Config.rank
    })
    let rank = await Promise.all(users.map(async (v, i) => {
      const groupMemberInfo = (await e.bot.GetGroupMemberInfo({ group_id: e.group_id, target_uin: v.user_id }))
      return `第${i + 1}名 ${groupMemberInfo.card || groupMemberInfo.nickname}(${v.user_id}) - ${v.cum}mL - ${v.cnt}次`
    }))
    await this.reply([
      segment.text('群被透榜：\n'),
      segment.text(rank.join('\n'))
    ])
  }
}
