export type primitive = number | string | boolean;

export type column = {
    name: string,
    type: primitive,
    size: number
}

export type table = {
    name: string,
    columns: column[]
}

const movies = {
    name: 'movies',
    columns: [
        {
            name: 'movieId',
            type: 'number',
            size: 4
        },
        {
            name: 'title',
            type: 'string',
            size: 200
        },
        {
            name: 'genres',
            type: 'string',
            size: 80
        }
    ]
} as table;
