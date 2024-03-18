# Home Assistant Combined Card

This is a Home Assisatant Lovelace card that seemlessly combines any other cards into a single card.

It was heavily inspired by [`stack-in-card`](https://github.com/custom-cards/stack-in-card), but takes a completely different approach to combining the cards. On top of that, it has a visual editor, allowing you to fully create your combined card from the UI. You can nest cards inside a combined card as deep as you'd like (i.e. use vertical and horizontal stacks as you see fit) without performance issues and without re-introducing borders and shadows inside the nested stacks.

## Examples

Here is a stack of cards created using [mushroom cards](https://github.com/piitaya/lovelace-mushroom).

![default cards](https://github.com/catdad-experiments/ha-combined-card/assets/2205537/7df801ea-6ebe-4f61-9b5f-1dc2683f2a74)

This stack looks pretty nice on its own, but can become chaotic inside a dashboard with even more cards.

With Combined Card, that entire stack can be placed inside a single card, giving it a better group look.

![combined in single stack](https://github.com/catdad-experiments/ha-combined-card/assets/2205537/e7423047-8e49-4fa1-a8c7-22379ef81039)

If this is too undefined for you, you can combine the cards more granularly, in this example into a porch card and a backyard card.

![combined in two groups](https://github.com/catdad-experiments/ha-combined-card/assets/2205537/d8691dd0-e89b-4772-b024-d887670ce365)
