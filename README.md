Parse MeSH topology data into CSV.
Each file represents tree changes that were made to the topology in the given year. Data is given in a table format with space separations:

| MH                | DELETED MN              | ADDED MN                |
| ----------------- | ----------------------- | ----------------------- |
| Acanthocytes      | A11.118.413.330.100     | A11.118.290.330.100     |
|                   | A15.145.229.413.330.100 | A15.145.229.334.330.100 |
| Animals, Congenic |                         | B1.30.157.40            |
|                   |                         | B1.30.199.40            |

Data explanation:
- If all entries exist, the node MH changes its ID from DELETED MN to ADDED MN.
- If MH (name) doesn't exist, the name of the previous row is used.
- If DELETED MN (old ID) doesn't exist, the node is newly created in this revision.
- If ADDED MN (new ID) doesn't exist, the node is deleted in this revision.

Difficulties when parsing the data:
 - Includes additional information above the table with unknown length
 - Column length is unknown and file dependent
 - Includes empty columns
 - Includes blank lines
 - Includes random comments inbetween table rows (marked in parantheses) such as "(Replaced for 2001 by Aortic Stenosis, Subvalvular)"
 - Table format can be broken, with a name exceeding its column and showing IDs in the next row outside their columns
 - IDs are incorrectly stored without preceding zeros (G1.23 instead of G01.023)

The output will be in a semicolon separated values format (because comma can be part of the name):
```Acanthocytes;A11.118.413.330.100;A11.118.290.330.100
Acanthocytes;A15.145.229.413.330.100;A15.145.229.334.330.100
Animals, Congenic;;B1.30.157.40
Animals, Congenic;;B1.30.199.40
```

The data is copied from [MeSH Archive](ftp://nlmpubs.nlm.nih.gov/online/mesh/).
For more information about the data check [MeSH Information](https://www.nlm.nih.gov/mesh/filelist.html).
