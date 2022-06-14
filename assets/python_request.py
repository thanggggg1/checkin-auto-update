#!/usr/bin/env python2
# # -*- coding: utf-8 -*-
import json
from logging import exception
import argparse
import requests
import ast

parser = argparse.ArgumentParser(description='ZK Basic Reading Tests')
parser.add_argument('-q', '--queries',
                    type=str,
                    help='{\"url\":\"http://10.20.1.201:8098/api/transaction/list?pageNo=1&pageSize=20&access_token=6AABB62DB8878A4D7373F57A237F6C94ABAA7B5261729D956E9593DF1F48D504\", \"method\":\"post\"}', default='\{\}')

parser.add_argument('-p', '--params',
                    type=str,
                    help='{\"pageSize\":\"1\"}', default='\{\}')


args = parser.parse_args()

if args.queries:
    try:
        _paramsJson = json.loads(str(args.queries))
        url = _paramsJson['url']
        method = _paramsJson['method'] if _paramsJson.get('method') else 'get'
        params = _paramsJson['params'] if _paramsJson.get('params') else {}
        if method == 'get':
            res = requests.get(url, params=params)
            print(json.dumps({"header": str(res.headers), "response": res.text if 'html>' not in res.text else ""}))
        if method == 'post':
            res = requests.post(url, data=params)
            print(json.dumps({"header": str(res.headers), "response": res.text if 'html>' not in res.text else ""}))
    except Exception as e:
        print(json.dumps({"header": "", "response": "", "error": str(e.args)}))

