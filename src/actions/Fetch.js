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
      console.log(params);
    const context = Context.getInstance();
    const model = context.getModelFromState(state);
    const endpoint = Action.transformParams('$fetch', model, params);
    console.log('rrrr');
    console.log(endpoint);
    const axios =  new Axios(model.methodConf.http);
    const method = Action.getMethod('$fetch', model, 'get');
    console.log(params);
    const request = axios[method](endpoint, params.data);

    this.onRequest(commit);
    try {
      await this.onSuccess(commit, model, await request);
    } catch(error) {
        console.log('eeeee');console.log(error);
      this.onError(commit, error);
    }

    return request;
  }

  /**
   * On Request Method
   * @param {object} commit
   */
  static onRequest(commit) {
    commit('onRequest');
  }

  /**
   * On Successful Request Method
   * @param {object} commit
   * @param {object} model
   * @param {object} data
   */
  static onSuccess(commit, model, data) {
    if (data.status != 200) {
      commit('onError', {data: data});
      return ;
    }
    let globalDatas = data.globalDatas ? data.globalDatas : {};
    let datas = data.datas;
    //let formatDatas = model.formatData(data.datas);
    let results = {
      infos: datas.infos ? datas.infos : {},
      info: datas.info ? datas.info : {},
      baseFields: datas.baseFields ? datas.baseFields : {},
      relateAttributes: datas.relateAttributes ? datas.relateAttributes : {},
      pages: datas.pages ? datas.pages : {},
      listSearchAttributes: datas.listSearchAttributes ? datas.listSearchAttributes : {},
      datas: datas
    }
    commit('onSuccess', results)
    model.returnDatas = results;
    model.globalDatas = globalDatas;
    return ;
    //model.commit((state) => {state.returnDatas = data})
    //return model.insertOrUpdate({data});
  }

  /**
   * On Failed Request Method
   * @param {object} commit
   * @param {object} error
   */
  static onError(commit, error) {
    commit('onError', error)
  }
}
