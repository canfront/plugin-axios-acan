import Axios from '../orm/axios';
import Action from './Action'
import Context from '../common/context'

export default class Fetch extends Action {
  /**
   * Call $fetch method
   * @param {object} store
   * @param {object} params
   */
  static async call ({ state, commit }, params = {}) {
    const context = Context.getInstance();
    const model = context.getModelFromState(state);
    const endpoint = Action.transformParams('$fetch', model, params);
    const axios =  new Axios(model.methodConf.http);
    const method = Action.getMethod('$fetch', model, 'get');
    const request = axios[method](endpoint, params.data);

    let action = this.getActionCode(params);
    this.onRequest(commit, action);
    try {
      await this.onSuccess(commit, model, action, await request);
    } catch(error) {
      this.onError(commit, error, action);
    }

    return request;
  }

  /**
   * On Request Method
   * @param {object} commit
   */
  /*static onRequest(commit) {
    commit('onRequest');
  }*/

  /**
   * On Failed Request Method
   * @param {object} commit
   * @param {object} error
   */
  /*static onError(commit, error) {
    commit('onError', error)
  }*/
}
