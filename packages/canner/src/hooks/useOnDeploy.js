// @flow

import { useCallback } from 'react';
import RefId from 'canner-ref-id';
import produce, { setAutoFreeze } from 'immer';
import {
  set, get, isArray, isPlainObject,
} from 'lodash';

setAutoFreeze(false);

export default function ({
  onDeploy,
  removeOnDeploy,
  refId,
  routes
}: {
  onDeploy: Function,
  removeOnDeploy: Function,
  refId: RefId,
  routes: Array<string>
}) {
  const firstKey = routes[0];
  const _removeOnDeploy = useCallback((arg1: string, callbackId: string) => {
    if (callbackId) {
      return removeOnDeploy(arg1, callbackId);
    }
    return removeOnDeploy(firstKey, arg1);
  }, [firstKey, removeOnDeploy]);

  const _onDeploy = useCallback((arg1: string | Function, callback: Function): string => {
    if (typeof arg1 === 'string') {
      return onDeploy(arg1, callback);
    }
    // first arguments is a function
    return onDeploy(firstKey, (result) => {
      let restPathArr = refId.getPathArr();
      // if (this.id) {
      //   restPathArr = restPathArr.slice(2);
      // } else {
      restPathArr = restPathArr.slice(1);
      // }
      const { paths, value } = getValueAndPaths(result.data, restPathArr);
      return {
        ...result,
        data: produce(result.data, (draft) => {
          // $FlowFixMe
          set(draft, paths, arg1(value));
        }),
      };
    });
  }, [firstKey, refId, onDeploy]);
  return {
    removeOnDeploy: _removeOnDeploy,
    onDeploy: _onDeploy,
  };
}

export function getValueAndPaths(value: Map<string, *>, idPathArr: Array<string>) {
  return idPathArr.reduce((result: any, key: string) => {
    let v = result.value;
    let paths = result.paths;
    if (isPlainObject(v)) {
      if ('edges' in v && 'pageInfo' in v) {
        v = get(v, ['edges', key, 'node']);
        paths = paths.concat(['edges', key, 'node']);
      } else {
        v = get(v, key);
        paths = paths.concat(key);
      }
    } else if (isArray(v)) {
      v = get(v, key);
      paths = paths.concat(key);
    }
    return {
      value: v,
      paths,
    };
  }, {
    value,
    paths: [],
  });
}
