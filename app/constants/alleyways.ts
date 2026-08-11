export interface Alleyway {
    name: string;
    lat: number;
    lng: number;
}

/** هر ردیف یک کوچه جدا با یک مختصات */
export const alleyways: Alleyway[] = [
    { name: 'جوانمرد 1', lat: 36.215474, lng: 57.691075 },
    { name: 'جوانمرد 2', lat: 36.215260, lng: 57.691062 },
    { name: 'جوانمرد 3', lat: 36.214638, lng: 57.690683 },
    { name: 'جوانمرد 4', lat: 36.214679, lng: 57.690770 },
    { name: 'جوانمرد 5', lat: 36.213920, lng: 57.690344 },
    { name: 'جوانمرد 6', lat: 36.213774, lng: 57.690335 },
    { name: 'جوانمرد 7', lat: 36.213607, lng: 57.690175 },
    { name: 'جوانمرد 8', lat: 36.213669, lng: 57.690282 },
    { name: 'جوانمرد 9', lat: 36.213114, lng: 57.689915 },
    { name: 'جوانمرد 10', lat: 36.213218, lng: 57.690065 },
    { name: 'جوانمرد 11', lat: 36.211907, lng: 57.689254 },
    { name: 'جوانمرد 12', lat: 36.211907, lng: 57.689353 },
    { name: 'جوانمرد 13', lat: 36.211700, lng: 57.689146 },
    { name: 'جوانمرد 14', lat: 36.211238, lng: 57.688992 },
    { name: 'جوانمرد 15', lat: 36.211243, lng: 57.688901 },
    { name: 'جوانمرد 16', lat: 36.210688, lng: 57.688712 },
    { name: 'جوانمرد 17', lat: 36.209644, lng: 57.688172 },
    { name: 'جوانمرد 18', lat: 36.209267, lng: 57.688086 },
    { name: 'جوانمرد 19', lat: 36.209145, lng: 57.687975 },
    { name: 'جوانمرد 20', lat: 36.208277, lng: 57.687754 },
    { name: 'جوانمرد 21', lat: 36.207924, lng: 57.687516 },
    { name: 'جوانمرد 22', lat: 36.208010, lng: 57.687633 },
    { name: 'جوانمرد 23', lat: 36.207541, lng: 57.687397 },
    { name: 'جوانمرد 24', lat: 36.207430, lng: 57.687410 },
    { name: 'جوانمرد 25', lat: 36.207110, lng: 57.687214 },
    { name: 'جوانمرد 26', lat: 36.206918, lng: 57.687207 },
    { name: 'جوانمرد 27', lat: 36.206517, lng: 57.687029 },
];

export function findAlleywayByName(name: string): Alleyway | undefined {
    return alleyways.find(a => a.name === name);
}

export function getAlleywayPoint(alley: Alleyway): [number, number] {
    return [alley.lat, alley.lng];
}
