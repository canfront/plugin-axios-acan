import forEach from 'lodash/forEach';
import has from 'lodash/has';
import map from 'lodash/map';
import merge from 'lodash/merge';
import Context from '../common/context';
import { ModuleConfig, ModelConfig } from '../support/interfaces';

export default class Action {
  /**
   * Transform Module to include ModuleConfig
   * @param {object} model
   */
  static transformModule(module) {
    return merge({}, ModuleConfig, module);
  }

  /**
   * Transform Model to include ModelConfig
   * @param {object} model
   */
  static transformModel(model) {
    const context = Context.getInstance();
    ModelConfig.http = merge({}, ModelConfig.http, context.options.http);
    model.methodConf = merge({}, ModelConfig, model.methodConf);
    //model.methodConf.http.url = (model.methodConf.http.url === '/') ? `/${model.entity}` : model.methodConf.http.url;

    /**
     * Add Model Interface to each model
     */
    model.getFields = () => {
      if (!model.cachedFields) {
        model.cachedFields = merge({}, {
          $id: model.attr(undefined),
          $isUpdating: model.boolean(false),
          $updateErrors: model.attr([]),
          $isDeleting: model.boolean(false),
          $deleteErrors: model.attr([]),
        }, model.fields());
      }

      return model.cachedFields;
    };

    return model;
  }

  /**
   * Transform Params and Return Endpoint
   * @param {string} type
   * @param {object} model
   * @param {object} config
   */
  static transformParams(type, model, config = {}) {
  	let urlBase = model.methodConf.http.url;
  	let envType = !config.params ? 'front' : (config.params.env_type ? config.params.env_type : 'front');
  	urlBase = model.methodConf.http['url_' + envType];
    let endpoint = `${urlBase}${model.methodConf.methods[type].http.url}`;
    const params = map(endpoint.match(/(\/?)(\:)([A-z]*)/gm), param => param.replace('/', ''));

    forEach(params, (param) => {
      const paramValue = has(config.params, param.replace(':', '')) ? config.params[param.replace(':', '')] : '';
      endpoint = endpoint.replace(param, paramValue).replace('//', '/');
    });
    if (config.query) {
      let preMark = endpoint.includes('?') ? '&' : '?';
      endpoint += preMark + `${Object.keys(config.query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(config.query[k])}`).join('&')}`;
    }
    return endpoint;
  }

   /**
   * Get appropriate methods
   * @param {string} type
   * @param {object} model
   * @param {string} defaultMethod
   */
  static getMethod(type, model, defaultMethod) {
    const customMethod = model.methodConf.methods[type].http.method;
    return (customMethod) ? customMethod : defaultMethod;
  }

  /**
   * On Successful Request Method
   * @param {object} commit
   * @param {object} model
   * @param {object} data
   */
  static onSuccess(commit, model, stateIndex, data) {
  	  console.log('dddddd', data);
    if (data.code != 200) {
      let eDatas = {
        loading: this.withIndexData(stateIndex, false),
        errors: this.withIndexData(stateIndex, data),
	  };

      commit('onError', eDatas);
      return ;
    }
    //data = JSON.parse(JSON.stringify(data));
    let datas = {
      datas: this.withIndexData(stateIndex, data.datas),
      globalDatas: this.withIndexData(stateIndex, data.globalDatas ? data.globalDatas : {}),
      loading: this.withIndexData(stateIndex, false),
      errors: this.withIndexData(stateIndex, {code: 200, message: 'OK'}),
    };
    commit('onSuccess', datas);
    return ;
    //model.returnDatas = results;
    //model.commit((state) => {state.returnDatas = data})
    //return model.insertOrUpdate({data});
  }

  static withIndexData(index, data) {
  	let rData = {};
  	rData[index] = data;
  	return rData;
  }

  static onRequest(commit, stateIndex) {
    let datas = {
      loading: this.withIndexData(stateIndex, true),
      errors: this.withIndexData(stateIndex, {}),
    };
    commit('onRequest', datas);
  }

  static onError(commit, error, stateIndex) {
    let eDatas = {
      loading: this.withIndexData(stateIndex, false),
      errors: this.withIndexData(stateIndex, {data: error}),
    };
    commit('onError', eDatas)
  }

  static getActionCode(params) {
    let tmpParams = params.params ? params.params : {};
    let action = tmpParams.action ? tmpParams.action : '';
    action = action.replace('-', '');
    action += tmpParams.actionExt ? tmpParams.actionExt : '';
    action = !action ? 'default' : action;
    //console.log('aaaaaaa', action);
    return action;
  }
}
