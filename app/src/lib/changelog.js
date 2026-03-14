export const CURRENT_VERSION = '1.4.0';

export const CHANGELOG = [
  {
    version: '1.4.0',
    date: '2026-03-14',
    type: 'feature',
    summary: 'Empréstimos Modais no Construtor',
    changes: [
      {
        type: 'feature',
        text: 'Nova seção "Empréstimos Modais" permanente no Construtor: veja acordes de todos os 7 modos paralelos (Dórico, Frígio, Lídio, Mixolídio, Eólio, Lócrio).',
      },
      {
        type: 'feature',
        text: 'Acordes exclusivos de cada modo destacados em roxo; acordes compartilhados com o tom atual aparecem em opacidade reduzida.',
      },
      {
        type: 'feature',
        text: 'Acordes emprestados na progressão ganham badge colorido (ex: [Dór]) na timeline e no texto exportado.',
      },
    ],
  },
  {
    version: '1.3.1',
    date: '2026-03-14',
    type: 'fix',
    summary: 'Bugfix: dominantes secundários com tétrade',
    changes: [
      {
        type: 'fix',
        text: 'Dominantes secundários não exibem mais sufixo "7" duplicado (ex: "G77" → "G7") quando o modo Tétrades está ativado.',
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-03-13',
    type: 'feature',
    summary: 'Tétrades e explicabilidade no Analisador',
    changes: [
      {
        type: 'feature',
        text: 'Tétrades (7ª) agora são o padrão — toggle nos controles para alternar entre tríades e tétrades em todo o app.',
      },
      {
        type: 'feature',
        text: 'Analisador exibe explicação detalhada: funções harmônicas, empréstimos modais e análise de cada acorde da sequência.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-03-12',
    type: 'feature',
    summary: 'Construtor de Progressões',
    changes: [
      {
        type: 'feature',
        text: 'Nova aba "Construtor": monte progressões clicando nos acordes do campo harmônico.',
      },
      {
        type: 'feature',
        text: 'Sugestões de próximos acordes por movimentos funcionais, cadências e dominantes secundários.',
      },
      {
        type: 'feature',
        text: 'Timeline de progressão com navegação retroativa e exportação em texto.',
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-03-11',
    type: 'feature',
    summary: 'Analisador de Sequências Harmônicas',
    changes: [
      {
        type: 'feature',
        text: 'Nova aba "Analisador": identifica a tonalidade de uma sequência de acordes.',
      },
      {
        type: 'feature',
        text: 'Exibe grau romano, função harmônica e confiança para cada candidato de tonalidade.',
      },
      {
        type: 'feature',
        text: 'Destaque de acordes não diatônicos e empréstimos modais.',
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-03-10',
    type: 'feature',
    summary: 'Lançamento inicial',
    changes: [
      {
        type: 'feature',
        text: 'Explorador de campo harmônico com grafo interativo (D3).',
      },
      {
        type: 'feature',
        text: 'Painel lateral com notas, função harmônica e modulação por acorde.',
      },
      {
        type: 'feature',
        text: 'Suporte a 8 escalas/modos: maior, menor, dórico, frígio, lídio, mixolídio, lócrio e menor melódica.',
      },
      {
        type: 'feature',
        text: 'Histórico de modulações com botão "Voltar".',
      },
    ],
  },
];
