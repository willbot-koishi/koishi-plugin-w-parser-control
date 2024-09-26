import { Context, Schema, h } from 'koishi'
import {} from 'koishi-plugin-w-parser'
import { P, nil } from 'parsecond'

declare module 'koishi-plugin-w-parser' {
    interface ParserStacks {}
}

export const name = 'w-parser-control'

export const inject = [ 'parser' ]

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context) {
    const { dispose } = ctx.parser.layer('root', {
        name: 'semicolon',
        precedence: 1,
        middleware: root => state => P.map(
            P.binOp(
                [ ';' ],
                root({
                    ...state,
                    terminator: P.alt([ P.str(';'), state.terminator ?? P.fail(nil) ])
                }),
                'left',
                ';'
            ),
            rootExpr => env => {
                const evalExpr = async (expr: typeof rootExpr): Promise<h.Fragment> =>
                    typeof expr === 'function'
                        ? expr(env)
                        : [ await evalExpr(expr.lhs), await evalExpr(expr.rhs) ].join('\n')
                return evalExpr(rootExpr)
            }
        )
    })

    ctx.on('dispose', () => {
        dispose()
    })
}
