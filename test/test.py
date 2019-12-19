
import pandas as pd
import numpy as np
import fbprophet as ph
import matplotlib.pyplot as plt
import datetime

df = pd.read_csv("../data/OSI/peopco_3years.csv", parse_dates=['date'])
df['date'] = pd.to_datetime(df['date'], unit='ms')
df = df.set_index('date')
print df.head(5)

data = df.resample('5Min').last().interpolate()
print data.head(5)
