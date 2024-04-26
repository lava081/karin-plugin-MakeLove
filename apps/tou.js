import { segment, plugin } from '#Karin'

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
        }
      ]
    })
  }

  async fuckOne (e) {
  }
}
