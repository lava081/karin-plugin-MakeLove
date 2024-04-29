import { segment, plugin } from '#Karin'
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
          reg: /^#?喝补品$/,
          fnc: 'exercise'
        },
        {
          reg: /^#?淫荡指数$/,
          fnc: 'info'
        },
        {
          reg: /^#?群淫荡榜$/,
          fnc: 'rank'
        }
      ]
    })
  }

  async fuckOne (e) {
    /** 没有指定群友(包括仅@机器人和@全体成员) */
    if (!e.at.length) {
      return await this.reply('不知道透谁？那就把屁股撅好准备挨透吧！')
    }
    /** 随机扣除30-100cal体力 */
    const energy_cost = Math.floor(30 + Math.random() * 70)
    /** 精液量倍数 */
    const cum_rate = 0.05 * Math.floor(1 + Math.random() * 5)
    /** 增加的精液量 */
    const cum_raise = Math.floor(energy_cost * cum_rate)
    /** 获取双方信息(不存在则自动创建) */
    let operator_user = await DB.getUser(e.group_id, e.user_id)
    let target_user = await DB.getUser(e.group_id, e.at[0])
    /** 体力不足 */
    if (operator_user.energy < energy_cost) {
      return await this.reply('杂鱼大叔，你已经是强弩之末啦！\n要我给你搞点补品喝喝吗？')
    }
    /** 操作数据 */
    operator_user.energy -= energy_cost
    target_user.cum += Math.floor(energy_cost * cum_rate)
    target_user.cnt++
    operator_user.save()
    target_user.save()
    /** 发送消息 */
    await this.reply([
      segment.text('你透了'),
      segment.at(e.at[0]),
      segment.text(`\n${cum_raise}mL精液被喂给了他，小小的肚子里容纳了${target_user.cum}mL精液。\n你消耗了${energy_cost}卡路里，还剩${operator_user.energy}卡路里。`),
      segment.image(e.bot.getAvatarUrl(e.at[0], 100))
    ])
  }

  async exercise (e) {
    /** 当前时间 */
    const time_now = new Date().getTime()
    /** 随机增加100-600cal体力 */
    const energy_raise = Math.floor(100 + Math.random() * 500)
    let user = await DB.getUser(e.group_id, e.user_id)
    if (user.updatedAt.getTime() <= time_now && time_now - user.updatedAt.getTime() < Config.Config.cooldown * 1000) {
      return await this.reply(`这么快就不行了啊，你的补品还没产好呢！\n预计需要${Config.Config.cooldown - Math.floor((time_now - user.updatedAt.getTime()) / 1000)}秒`)
    }
    user.energy += energy_raise
    await user.save()
    await this.reply(`你吞下了神秘补品，体力恢复了${energy_raise}卡路里。\n还剩${user.energy}卡路里。`)
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
      segment.text('群淫荡榜：\n'),
      segment.text(rank.join('\n'))
    ])
  }
}
