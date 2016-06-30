import pandas as pd
import numpy as np
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../public/data/")

allData = pd.read_excel(os.path.join(os.path.dirname(__file__), "./data.xlsx"), sheet_name="all UK data", engine="xlrd")
subSectors = pd.read_excel(os.path.join(os.path.dirname(__file__), "./data.xlsx"), sheet_name="subsector breakdowns", engine="xlrd")

print dict(zip(allData.iloc[:, 0].tolist(), allData.loc[:, "Total"].tolist()))

income_headings = [
    ("Individuals", ("Donations", "Legacies", "Fees for services", "Fundraising")),
    ("Private sector", ("Donations", "Earned")),
    ("National lottery", ())
    ("Goverment sources", ("Grants", "Contracts and fees")),
     ("Voluntary sector", ("Grants", "Earned")),
      ("Investments", ("
  ]

# df = df[~df["income"].isnull()]
# df = df[df["income"] > 0]
# df = df.sort("income", ascending=False)

# df["subSector"] = df["ICNPO"]


# # grouped = df.groupby(["subSector", "strata"])
# grouped = df.groupby(["subSector", "strata"])
# #grouped = df.groupby(["subSector"])

# aggregated = grouped.agg({
#         "income": np.sum,
#         "expend": np.sum,
#     }).reset_index()
# aggregated.index.name = "id"

# aggregated.to_csv(OUTPUT_DIR + "sub-sector-strata.csv")

# #print aggregated

# for i, x in aggregated.iterrows():
#     items = df[(df["strata"] == x["strata"]) & (df["subSector"] == x["subSector"])]
#     items = items[["name", "income", "expend"]]
#     items = items.sort("income", ascending=False)
#     top = items[:1000]
#     rest = items[1000:]


#     top.to_csv(OUTPUT_DIR + "sub-sector-strata-%s.csv" % (i,))
