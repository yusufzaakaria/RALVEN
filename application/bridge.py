"""Optional local yfinance adapter. Statements and shares normalize to billions."""
import os, sys, json, math, re, datetime, concurrent.futures
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.python-libs'))
def main():
 import yfinance as yf
 cache=os.path.join(os.path.dirname(__file__),'.cache')
 os.makedirs(cache,exist_ok=True)
 yf.set_tz_cache_location(cache)
 ticker=sys.argv[1].upper()
 if not re.fullmatch('[A-Z]{4}',ticker): raise ValueError('Invalid IDX ticker')
 def fetch_one(code,history=True):
  t=yf.Ticker(code+'.JK'); info=t.get_info(); inc=t.income_stmt; bal=t.balance_sheet; cash=t.cashflow
  if inc.empty or bal.empty or cash.empty: raise ValueError('Annual statements are incomplete for '+code)
  common=sorted(set(inc.columns)&set(bal.columns)&set(cash.columns),reverse=True)
  if not common: raise ValueError('No aligned annual statement periods')
  period=common[0]
  def read(frame,keys,col=period):
   for key in keys:
    if key in frame.index and col in frame.columns:
     v=frame.loc[key,col]
     if math.isfinite(float(v)): return float(v)/1e9
   return None
  def number(key,scale=1):
   v=info.get(key)
   return float(v)/scale if isinstance(v,(int,float)) and math.isfinite(v) else None
  if info.get('currency')!='IDR' or info.get('financialCurrency')!='IDR': raise ValueError('Price and financial statements must both be in IDR. Import a documented currency conversion.')
  sector=info.get('sector','Unknown'); bank='Financial' in sector
  price=number('regularMarketPrice') or number('currentPrice'); quote=info.get('regularMarketTime')
  if not quote: raise ValueError('Provider omitted quote timestamp')
  ni=read(inc,['Net Income Common Stockholders','Net Income']); ebit=read(inc,['EBIT','Operating Income']); ebitda=read(inc,['EBITDA'])
  if bank and ebit is None: ebit=read(inc,['Pretax Income'])
  if bank and ebitda is None: ebitda=ebit
  debt=read(bal,['Total Debt']); cash_value=read(bal,['Cash And Cash Equivalents']); minority=read(bal,['Minority Interest']); preferred=read(bal,['Preferred Stock Equity','Preferred Stock'])
  inferred=[]
  if minority is None: inferred.append('Minority interest unavailable; no zero assumption. Verify the issuer filing.')
  if preferred is None: inferred.append('Preferred equity unavailable; no zero assumption. Verify the issuer filing.')
  if bank: debt=0; cash_value=0; minority=0;preferred=0
  stamp=datetime.datetime.now(datetime.timezone.utc).isoformat();quote_date=datetime.datetime.fromtimestamp(quote,datetime.timezone.utc).date().isoformat()
  c=dict(ticker=code,name=info.get('longName',code),sector=sector,currency='IDR',units='IDR bn / shares bn',period=period.date().isoformat(),priceDate=quote_date,valuationDate=datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=7))).date().isoformat(),updatedAt=stamp,mode='live',price=price,shares=number('sharesOutstanding',1e9),revenue=read(inc,['Total Revenue','Operating Revenue']),ebit=ebit,netIncome=ni,ebitda=ebitda,bookEquity=read(bal,['Common Stock Equity','Stockholders Equity']),debt=debt,cash=cash_value,minority=minority,preferred=preferred,history=[],prices=[],peers=[])
  c['source']=f'Yahoo Finance via yfinance; https://finance.yahoo.com/quote/{code}.JK/financials/; annual statements ending {c["period"]}; retrieved {stamp}. Current shares outstanding proxy diluted shares; verify dilution. '+ ' '.join(inferred)
  cap=read(cash,['Capital Expenditure']);c['capexRatio']=abs(cap)/c['revenue'] if cap is not None and c['revenue'] else None
  for col in reversed(common[:4]): c['history'].append(dict(year=col.year,revenue=read(inc,['Total Revenue','Operating Revenue'],col),ebit=read(inc,['EBIT','Operating Income','Pretax Income'],col),netIncome=read(inc,['Net Income Common Stockholders','Net Income'],col),ocf=read(cash,['Operating Cash Flow','Total Cash From Operating Activities'],col)))
  if history:
   hist=t.history(period='1y',auto_adjust=False)
   c['prices']=[dict(date=index.date().isoformat(),close=float(row['Close'])) for index,row in hist.iterrows() if math.isfinite(float(row['Close']))]
  return c
 c=fetch_one(ticker)
 groups={'Financial Services':['BBCA','BBRI','BMRI','BBNI'],'Communication Services':['TLKM','ISAT','EXCL','MTEL','TOWR'],'Consumer Defensive':['ICBP','INDF','MYOR','UNVR'],'Industrials':['ASII','UNTR','HEXA','AUTO'],'Energy':['PTBA','ITMG','ADRO','MEDC'],'Basic Materials':['ANTM','INCO','MDKA','TINS'],'Real Estate':['BSDE','CTRA','PWON','SMRA']}
 peers=[x for x in groups.get(c['sector'],[]) if x!=ticker][:4]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  futures=[pool.submit(fetch_one,x,False) for x in peers]
  for future in concurrent.futures.as_completed(futures):
   try: c['peers'].append(future.result())
   except Exception: pass
 print(json.dumps(c,allow_nan=False))
if __name__=='__main__':
 try: main()
 except Exception as exc:
  print(json.dumps({'error':str(exc)}));sys.exit(1)
