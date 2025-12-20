import pandas as pd

df = pd.read_csv('land_price_predictions.csv')

def get_past_prices(row, df):
    # Filter for matching location and years before current
    mask = (
        (df['Street'] == row['Street']) &
        (df['City'] == row['City']) &
        (df['District'] == row['District']) &
        (df['State'] == row['State']) &
        (df['SALE_YEAR'] < row['SALE_YEAR'])
    )
    # Get up to 5 most recent prices before this year
    prices = df.loc[mask].sort_values('SALE_YEAR', ascending=False)['price'].tolist()
    # Pad with zeros if less than 5 years
    prices = prices[:5]
    while len(prices) < 5:
        prices.insert(0, 0)
    return prices

df['past_prices'] = df.apply(lambda row: get_past_prices(row, df), axis=1)
df.to_csv('land_data_with_timeseries.csv', index=False)
