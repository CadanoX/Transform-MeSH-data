Parse MeSH topology data into CSV.
Tree changes are given in a table format with space separations.

| MH           | DELETED MN          | ADDED MN            |
| ------------ | ------------------- | ------------------- |
| Acanthocytes | A11.118.413.330.100 | A11.118.290.330.100 |

If all entries exist, the node MN changes its ID from DELETED MN to ADDED MN.
If MH (name) doesn't exist, the name of the previous row is used.
If DELETED MN (old ID) doesn't exist, the node is newly created in this revision.
If ADDED MN (new ID) doesn't exist, the node is deleted in this revision.

The data is copied from [MeSH Archive](ftp://nlmpubs.nlm.nih.gov/online/mesh/).
For more information about the data check [MeSH Information](https://www.nlm.nih.gov/mesh/filelist.html).
