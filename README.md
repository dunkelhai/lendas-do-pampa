# Lendas do Pampa

Deck-builder roguelike de combate por cartas em turnos contra criaturas do folclore sul-brasileiro.
Um gaúcho de lenço azul atravessa a coxilha do entardecer até a noite: três encontros, um galpão à
beira da estrada e, no fim, a furna encantada da **Salamanca do Jarau**.

Protótipo jogável feito com Phaser 3 + TypeScript + Vite. Toda a arte (criaturas, cartas, céu,
coxilhas, ícones) é gerada por código com `Graphics`/`RenderTexture`; os sons são sintetizados com
Web Audio.

**Jogar online (GitHub Pages):** https://dunkelhai.github.io/lendas-do-pampa/

## Como se joga

- **Mapa de 5 nós em sequência:** Combate (Negrinho do Pastoreio) → Combate (Lobisomem da Coxilha)
  → Evento (Galpão do Tropeiro) → Combate (Teiniaguá) → Chefe (Salamanca do Jarau).
- **Energia 3 por turno, mão de 5 cartas.** Pilha de compra e de descarte com contadores; quando a
  compra acaba, o descarte é reembaralhado. Bloqueio zera no início do seu turno. A vida persiste
  entre os combates.
- **Intenções visíveis:** acima (ou ao lado) de cada criatura aparece o que ela fará no próximo
  turno — espada = ataque (com o dano já calculado), escudo = defesa, seta verde = fortalecer
  (Força), seta roxa = enfeitiçar (Fraco/Vulnerável).
- **Recompensa:** após cada combate vencido, escolha 1 de 3 cartas do pool (ou pule).
- **Evento:** curar 30% da vida, ganhar uma relíquia ou remover uma carta do baralho.
- **Fim:** derrotar a Salamanca = vitória. Vida 0 = derrota e a run recomeça do zero.

### Status

| Status     | Efeito                                             |
| ---------- | -------------------------------------------------- |
| Força      | +1 de dano por golpe para cada ponto               |
| Destreza   | +1 de bloqueio em cartas de defesa para cada ponto |
| Vulnerável | recebe 50% a mais de dano (diminui 1 por rodada)   |
| Fraco      | causa 25% a menos de dano (diminui 1 por rodada)   |

### Cartas (20 no pool)

| Tipo                                 | Cartas                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Ataque                               | Relhaço\*, Laço Certeiro\*, Talho de Facão, Boleadeira, Estouro da Tropilha, Golpe do Minuano, Raio na Coxilha |
| Defesa                               | Poncho Firme\*, Encilhar, Galpão Seguro, Sanga Escondida, Esquiva Gaudéria                                     |
| Habilidade (buff)                    | Mate Amargo, Fogo de Chão, Grito de Guerra, Olhar do Carbúnculo                                                |
| Poder (efeito permanente no combate) | Espírito do Minuano, Chimarrão Quente, Pala Encantado, Vela Benta                                              |

\* cartas básicas do baralho inicial (5× Relhaço, 4× Poncho Firme, 1× Laço Certeiro); elas não
aparecem nas recompensas.

### Relíquias

- **Lasca de Carbúnculo:** ao vencer um combate, cure 6 de vida.
- **Guampa do Avô:** comece cada combate com 1 de Força.

## Controles

| Ação                                          | Teclado                                     | Mouse                                                                            |
| --------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| Selecionar carta                              | ← / → (ou A / D)                            | passar o mouse                                                                   |
| Jogar carta                                   | Z ou Espaço                                 | arrastar a carta até o inimigo (ataques e feitiços) ou para cima da mão (demais) |
| Encerrar turno                                | X, Shift ou E                               | botão "Encerrar turno"                                                           |
| Pausa (com opção "Reduzir tremor/flash")      | Esc                                         | —                                                                                |
| Reiniciar a run                               | R                                           | —                                                                                |
| Menus (título, mapa, recompensa, evento, fim) | setas + Z/Espaço/Enter; X pula a recompensa | clique                                                                           |

Soltar uma carta fora da área válida faz ela voltar para a mão com tween.

## Como rodar

```bash
npm install
npm run dev
```

Abra http://localhost:5173/lendas-do-pampa/ (adicione `?debug=1` para os atalhos de teste).

### Scripts

| Script            | O que faz                                                         |
| ----------------- | ----------------------------------------------------------------- |
| `npm run dev`     | servidor de desenvolvimento (Vite)                                |
| `npm run build`   | checagem de tipos (`tsc --noEmit`) + build de produção em `dist/` |
| `npm run preview` | serve o build de produção                                         |
| `npm run lint`    | ESLint + Prettier (`--check`)                                     |
| `npm run format`  | formata o código com Prettier                                     |

### Debug (`?debug=1`)

| Tecla | Efeito                                                                   |
| ----- | ------------------------------------------------------------------------ |
| F1    | vitória imediata (tela de vitória)                                       |
| F2    | derrota imediata (tela de derrota)                                       |
| F3    | vence o combate atual (segue para a recompensa / vitória se for o chefe) |
| F4    | +99 de energia no turno atual                                            |
| F6    | liga/desliga contador de FPS                                             |

`window.__game` expõe a instância do `Phaser.Game` (ex.: `__game.scene.getScene('Combat').combat`).

## Estrutura

```
src/
  main.ts                 aguarda as fontes, cria o jogo, expõe window.__game
  config/balance.ts       TODAS as constantes de balanceamento (cartas, inimigos, mapa, tempos)
  style/palette.ts        paleta do guia de estilo
  systems/                regras puras do combate, run, cartas, relíquias, áudio, efeitos, texturas
  entities/               textura das cartas, céu do pampa, HUD da run
  scenes/                 Boot, Title, Map, Combat, Reward, Event, End, Pause
```

## Créditos

- Código e arte gerada por código: dunkelhai (com auxílio de IA).
- Fontes: [Bangers](https://fonts.google.com/specimen/Bangers) e
  [Nunito](https://fonts.google.com/specimen/Nunito) via Google Fonts (SIL Open Font License).
- Lendas folclóricas de domínio público do Rio Grande do Sul (Negrinho do Pastoreio, Lobisomem,
  Teiniaguá, Salamanca do Jarau). Nenhum asset externo foi usado.

## Decisões

- **Negrinho do Pastoreio como "provação", não como vilão.** O briefing pede o Negrinho como inimigo
  comum, e o guia de estilo pede tratamento respeitoso (figura benevolente). Resolvi como um encontro
  de prova: a tropilha e o cavalo baio "atacam", ele acende a vela (buff) e, ao ser vencido, a tela
  diz "Provação vencida!" e ele some em luz — nada de morte ou caricatura.
- **Ordem fixa do mapa** (Negrinho → Lobisomem → Evento → Teiniaguá → Salamanca), da criatura mais
  simples para a mais traiçoeira; padrões de cada inimigo são ciclos fixos (3–4 movimentos), o chefe
  tem 4 intenções em ciclo e 110 de vida.
- **Relíquias:** as 2 relíquias são sorteadas no início da run — uma vem com o jogador e a outra é
  oferecida no evento.
- **Pool de 20 cartas** inclui as 3 básicas do baralho inicial; as recompensas sorteiam entre as 17
  restantes, ponderadas por raridade (comum 6, incomum 3, rara 1,5).
- **Poderes** saem do baralho até o fim do combate depois de jogados (efeito permanente). Força
  temporária ("Grito de Guerra") some no fim do turno.
- **Timing de status:** Fraco/Vulnerável diminuem 1 no fim de cada rodada (após o turno do inimigo);
  status recém-aplicados no jogador pelo inimigo não diminuem na mesma rodada.
- **Alvo único:** cada combate tem um inimigo, então teclado (Z/Espaço) mira nele automaticamente.
  No mouse, ataques/feitiços precisam ser soltos sobre o inimigo; defesa, buff e poder em qualquer
  ponto acima da mão.
- **Layout:** a mão fica na base em leque (cartas 180×252); a carta selecionada sobe e cresce 1,25×
  para leitura. Quando a criatura é alta demais para a intenção caber abaixo do HUD, a intenção fica
  ao lado dela. O nome do inimigo vai na faixa central do HUD.
- **Tipografia das cartas:** a plaquinha de tipo usa 16 px (o guia sugere 12 px, mas o mínimo geral é
  16 px). Nomes longos em Bangers 20 px são comprimidos horizontalmente para caber na faixa.
- **Tela de título** com "pressione Espaço" + controles (sem menu Jogar/Opções/Créditos, para manter o
  escopo); a opção "Reduzir tremor/flash" fica na pausa.
- **FPS** em F6 (no modo debug), porque F3 foi reservado para "vencer o combate".
- **Auto-repetição de tecla** é ignorada para teclas de ação (segurar Z não joga várias cartas);
  setas continuam repetindo.
- **Balanceamento:** simulei 2000 runs com um bot guloso que escolhe recompensas aleatórias: ~65% de
  vitórias, ~24 turnos por run (≈10–15 min para uma pessoa). Quem escolhe bem as cartas vence com
  folga; descuidar do bloqueio contra o chefe costuma ser fatal.

## Próximos passos

- Mapa ramificado com escolha de caminho e mais tipos de nó (loja, fogueira, elite).
- Mais eventos (incluindo um encontro benevolente com o Negrinho do Pastoreio) e mais relíquias.
- Segunda fase da Teiniaguá (forma de moça) e animações de ataque próprias por criatura.
- Melhorias de carta (upgrade) e tooltip de palavras-chave ao passar o mouse.
- Trilha sonora ambiente e mixagem de volume na pausa.
