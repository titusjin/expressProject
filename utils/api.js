var async = require('asyncawait/async');
var await = require('asyncawait/await');

var appRoot = require('app-root-path');

var dump = i => {
  var o = {};
  for (k in i) {
    if (i[k].test)
      o[k] = '' + i[k];
    else if (Array.isArray(i[k]))
      o[k] = i[k];
    else if (typeof i[k] == 'object')
      o[k] = dump(i[k]);
    else
      o[k] = i[k];
  }
  return o;
};

var check = (key, value, rule) => {
  if (Array.isArray(rule)) {
    if (rule.length > 0) {
      if (rule[0].substr) {
        // enum
        if (rule.indexOf(value) == -1)
          throw [-4, "value '" + value + "' of parameter '" + key + "' is not in ['" + rule.join("', '") + "']"];
      } else if (rule.length == 1 && Array.isArray(rule[0])) {
        // array of enum
        if (!Array.isArray(value))
          throw [-5, "type of parameter '" + key + "' must be array"];
        for (var i in value)
          if (rule[0].indexOf(value[i]) == -1)
            throw [-6, "value '" + value[i] + "' of parameter '" + key + "[" + i + "]' is not in ['" + rule[0].join("', '") + "']"];
      } else if (rule.length == 2) {
        // range
        if (value < rule[0] || value > rule[1])
          throw [-3, "value " + value + " of parameter '" + key + "' is not in the range of (" + rule[0] + ", " + rule[1] + ")"];
      }
    } else {
      // array
      if (!Array.isArray(value))
        throw [-5, "type of parameter '" + key + "' must be array"];
    }
  } else if (rule.test) {
    // regex
    if (!rule.test(value))
      throw [-7, "value '" + value + "' of parameter '" + key + "' does not match pattern " + rule];
  } else if (rule == 'int') {
    // int
    if (!/-?[0-9]+/.test(value) || isNaN(parseInt(value)))
      throw [-8, "value '" + value + "' of parameter '" + key + "' is not an integer"];
  } else if (rule == 'date') {
    // date
    //TODO
  } else if (rule == '') {
    // any
  }
};

var callback = (rules, func) =>
  async((req, res, next) => {
    res.rtn = (code, json) => {
      if (req.query.callback)
        res.jsonp({code: code+'', data:json});
      else
        res.json({code: code+'', data:json});
    };

    res.ok = (data) =>
      res.rtn(1, {message: 'ok', data: data});

    res.err = (code, message, error) =>
      res.rtn(code, {message: message, error: error});

    try {
      req.checked = {};
      var cols = ( req.body.data )? req.body.data:req.query;

      for (var key in rules) {
        // optional
        if (key == '_') {
          for (var _key in rules['_']) {
            if (_key in cols) {
              var value = cols[_key];
              check(_key, value, rules['_'][_key]);
              req.checked[_key] = value;
            }
          }
          continue;
        }

        if (rules[key] == 'file') {
          if (!req.files[key])
            throw [-10, "missing file '" + key + "'"];
          continue;
        }

        var value = cols[key];
        if (typeof value === 'undefined')
          throw [-2, "missing parameter '" + key + "'"];

        // if (rules[key] == 'user') {
        //   // get user from id
        //   req.user = await(User(value));
        //   if (!req.user) throw [-1, 'please login'];
        // }
        // else {
        //   check(key, value, rules[key]);
        //   req.checked[key] = value;
        // }
      }

      func(req, res, next);
    } catch(e) {
      console.log(e);
      if (Array.isArray(e))
        return res.err(e[0], e[1]);
      res.err(e.code? e.code: -99, e.message? e.message: 'unknown error', e);
    }
  });

var api = base => {
  api = require('express').Router();
  api._get = api.get;
  api._post = api.post;

  var help = {};
  var unit = {};

  api.get = (route, rules, func) => {
    if (typeof rules == 'function') {
      func = rules;
      rules = {};
    }
    help[base + route] = {get: rules};
    api._get(route, callback(rules, func));
    return api;
  };

  api.post = (route, rules, func) => {
    if (typeof rules == 'function') {
      func = rules;
      rules = {};
    }
    help[base + route] = {post: rules};
    api._post(route, require('connect-multiparty')(), callback(rules, func));
    return api;
  };

  api.help = (route) => {
    api._get(route, (req, res) => res.json(dump(help)));
    return api;
  };

  api.unit = (route, qs) => {
    unit[route] = qs;
    return api;
  };

  api.test = (route, uri) => {
    api._get(route, async((req, res) => {
      var Jobs = {};
      for (var path in unit)
        Jobs[base + path] = Get.json(uri + base + path, unit[path]);
      res.json(await(Jobs));
    }));
    return api;
  };

  return api;
};

module.exports = api;
