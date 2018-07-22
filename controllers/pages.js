async function list(ctx) {
    await ctx.render('list')
}

async function detail(ctx) {
    await ctx.render('detail') 
}

async function create(ctx) {
    await ctx.render('create')
}

module.exports = {
    detail,
    create,
    list
}
