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
    model.methodConf.http.url = (model.methodConf.http.url === '/') ? `/${model.entity}` : model.methodConf.http.url;

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
    let endpoint = `${model.methodConf.http.url}${model.methodConf.methods[type].http.url}`;
    const params = map(endpoint.match(/(\/?)(\:)([A-z]*)/gm), param => param.replace('/', ''));

    forEach(params, (param) => {
      const paramValue = has(config.params, param.replace(':', '')) ? config.params[param.replace(':', '')] : '';
      endpoint = endpoint.replace(param, paramValue).replace('//', '/');
    });
    if (config.query) endpoint += `?${Object.keys(config.query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(config.query[k])}`).join('&')}`;
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
      formFields: datas.formFields ? datas.formFields : {},
      datas: datas
    }
    commit('onSuccess', results)
    model.returnDatas = results;
    model.globalDatas = globalDatas;
    return ;
    //model.commit((state) => {state.returnDatas = data})
    //return model.insertOrUpdate({data});
  }
}
