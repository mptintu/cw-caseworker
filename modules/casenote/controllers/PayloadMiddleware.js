'use strict';

exports.getAllowedParamsAndValuesAsHash = (payload, params) => {
    var hash = {};
    for (var param in payload) {
        if (payload.hasOwnProperty(param)) {
            if (payload[param] != null && payload[param] != "") {
                if (params.indexOf(param) != -1) {
                    hash[param] = payload[param];
                }
            }
        }
    }
    return hash;
}
