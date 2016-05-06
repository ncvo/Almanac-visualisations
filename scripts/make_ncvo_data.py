import pandas as pd
import numpy as np
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../public/data/")

df = pd.read_csv(os.path.join(os.path.dirname(__file__), "../data_src/charity-population-2013-14.csv"))
df = df[~df["income"].isnull()]
df = df[df["income"] > 0]
df = df.sort("income", ascending=False)

df["subSector"] = df["ICNPO"]


# grouped = df.groupby(["subSector", "strata"])
grouped = df.groupby(["subSector", "strata"])
#grouped = df.groupby(["subSector"])

aggregated = grouped.agg({
        "income": np.sum,
        "expend": np.sum,
    }).reset_index()
aggregated.index.name = "id"

aggregated.to_csv(OUTPUT_DIR + "sub-sector-strata.csv")

#print aggregated

for i, x in aggregated.iterrows():
    items = df[(df["strata"] == x["strata"]) & (df["subSector"] == x["subSector"])]
    items = items[["name", "income", "expend"]]
    items = items.sort("income", ascending=False)
    top = items[:1000]
    rest = items[1000:]


    top.to_csv(OUTPUT_DIR + "sub-sector-strata-%s.csv" % (i,))

# for subSector, items in grouped.groups.items():
#     print subSector

#     items = df.ix[items]
#     grouped = items.groupby(["strata"])
#     aggregated = grouped.agg({
#         "income": np.sum,
#         "expend": np.sum,
#     }).reset_index()
#     aggregated.index.name = "id"

#     print aggregated

#     aggregated.to_csv(OUTPUT_DIR + "sub-sector-%s.csv" % (subSector,))

#     for strata, items in grouped.groups.items():
#         items = df.ix[items]
#         items.to_csv(OUTPUT_DIR + "sub-sector-%s-%s.csv" % (subSector,strata))
