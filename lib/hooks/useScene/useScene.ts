import produce from "immer";
import isEqual from "lodash/isEqual";
import { useEffect, useMemo, useState } from "react";
import { useCharacters } from "../../contexts/CharactersContext/CharactersContext";
import { defaultSceneName } from "../../contexts/SceneContext/ScenesContext";
import { getUnix } from "../../domains/dayjs/getDayJS";
import { Id } from "../../domains/Id/Id";
import { SceneFactory } from "../../domains/scene/SceneFactory";
import { IIndexCard, IIndexCardType, IScene } from "./IScene";

const temporaryGMIdUntilFirstSync = "temporary-gm-id-until-first-sync";

export type IProps = {
  userId: string;
  charactersManager: ReturnType<typeof useCharacters>;
};

export function useScene(props: IProps) {
  const [scene, setScene] = useState<IScene | undefined>();

  const [sceneToLoad, setSceneToLoad] = useState<IScene | undefined>(undefined);

  const dirty = useMemo(() => {
    if (!sceneToLoad) {
      return false;
    }

    return !isEqual(sceneToLoad, scene);
  }, [scene, sceneToLoad]);

  useEffect(() => {
    if (sceneToLoad) {
      setScene(sceneToLoad);
    }
  }, [sceneToLoad]);

  function overrideScene(newScene: IScene) {
    if (newScene) {
      setScene(newScene);
    }
  }

  function loadScene(newScene: IScene, keepPinned: boolean) {
    if (newScene) {
      const pinnedIndexCards = getPinnedIndexCards(scene);
      const publicIndexCards = keepPinned
        ? [...pinnedIndexCards.publicIndexCards, ...newScene.indexCards.public]
        : newScene.indexCards.public;
      const privateIndexCards = keepPinned
        ? [
            ...pinnedIndexCards.privateIndexCards,
            ...newScene.indexCards.private,
          ]
        : newScene.indexCards.private;

      setSceneToLoad({
        id: newScene.id,
        name: newScene.name,
        group: newScene.group,
        indexCards: {
          public: publicIndexCards,
          private: privateIndexCards,
        },
        notes: newScene.notes,
        lastUpdated: newScene.lastUpdated,
        version: newScene.version,
      });
    }
  }

  function cloneAndLoadNewScene(newScene: IScene) {
    if (newScene) {
      const clonedNewScene = produce(newScene, (draft) => {
        draft.id = Id.generate();
      });
      loadScene(clonedNewScene, true);
      forceDirty();
    }
  }

  function forceDirty() {
    setTimeout(() => {
      setScene(
        produce((draft) => {
          if (!draft) {
            return;
          }
          draft.lastUpdated = getUnix();
        })
      );
    });
  }

  function reset() {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        const pinnedIndexCards = getPinnedIndexCards(scene);
        draft.name = defaultSceneName;
        draft.id = Id.generate();
        draft.indexCards = {
          public: pinnedIndexCards.publicIndexCards,
          private: pinnedIndexCards.privateIndexCards,
        };
      })
    );
  }

  function updateName(name: string) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        draft.name = name;
      })
    );
  }

  function setGroup(newGroup: string | null | undefined) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        draft.group = newGroup as string | undefined;
      })
    );
  }

  function addIndexCard(
    type: IIndexCardType,
    cardProducer?: (card: IIndexCard) => IIndexCard | void
  ) {
    const defaultCard = SceneFactory.makeIndexCard();
    const newCard = cardProducer
      ? produce(defaultCard, cardProducer)
      : defaultCard;
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        const cards = draft.indexCards[type];

        cards.unshift(newCard);
      })
    );
    setTimeout(() => {
      try {
        const indexCard: HTMLSpanElement | null = document.querySelector(
          `#index-card-${newCard.id}`
        );
        if (indexCard) {
          indexCard.focus();
        }
      } catch (error) {}
    });
    return newCard;
  }

  function removeIndexCard(indexCardId: string, type: IIndexCardType) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        const cards = draft.indexCards[type];
        const index = cards.findIndex((c) => c.id === indexCardId);
        cards.splice(index, 1);
      })
    );
  }

  function duplicateIndexCard(indexCard: IIndexCard, type: IIndexCardType) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        const cards = draft.indexCards[type];
        const index = cards.findIndex((c) => c.id === indexCard.id);
        const copy = SceneFactory.duplicateIndexCard(indexCard);
        cards.splice(index, 0, copy);
      })
    );
  }

  function updateIndexCard(updatedIndexCard: IIndexCard, type: IIndexCardType) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        const cards = draft.indexCards[type];
        const index = cards.findIndex((c) => c.id === updatedIndexCard.id);
        cards[index] = updatedIndexCard;
      })
    );
  }

  function toggleIndexCardSection(
    indexCardToMove: IIndexCard,
    from: IIndexCardType
  ) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        draft.indexCards[from] = draft.indexCards[from].filter(
          (i) => i.id !== indexCardToMove.id
        );

        const to: IIndexCardType = from === "public" ? "private" : "public";
        draft.indexCards[to].unshift(indexCardToMove);
      })
    );
  }

  function moveIndexCard(
    dragIndex: number,
    hoverIndex: number,
    type: IIndexCardType
  ) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        if (!draft) {
          return;
        }

        if (dragIndex === undefined || hoverIndex === undefined) {
          return;
        }

        const cards = draft.indexCards[type];

        const dragItem = cards[dragIndex];

        cards.splice(dragIndex, 1);
        cards.splice(hoverIndex, 0, dragItem);
      })
    );
  }

  function resetInitiative() {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }

        draft.indexCards.public.forEach((indexCard) => {
          indexCard.playedDuringTurn = false;
          indexCard.subCards.forEach((subCard) => {
            subCard.playedDuringTurn = false;
          });
        });
        draft.indexCards.private.forEach((indexCard) => {
          indexCard.playedDuringTurn = false;
          indexCard.subCards.forEach((subCard) => {
            subCard.playedDuringTurn = false;
          });
        });
      })
    );
  }

  function setNotes(notes: string) {
    setScene(
      produce((draft) => {
        if (!draft) {
          return;
        }
        draft.notes = notes;
      })
    );
  }

  return {
    state: {
      scene,
      dirty,
    },
    actions: {
      addIndexCard: addIndexCard,
      cloneAndLoadNewScene,
      reset,
      loadScene,
      toggleIndexCardSection,
      moveIndexCard,
      removeIndexCard,
      duplicateIndexCard,
      resetInitiative,
      overrideScene: overrideScene,
      setGroup,
      setNotes,
      updateIndexCard,
      updateName,
    },
  };
}

function getPinnedIndexCards(scene: IScene | undefined) {
  if (!scene) {
    return { publicIndexCards: [], privateIndexCards: [] };
  }
  const publicIndexCards = scene.indexCards.public.filter((i) => i.pinned);
  const privateIndexCards = scene.indexCards.private.filter((i) => i.pinned);

  return { publicIndexCards, privateIndexCards };
}

export interface IPeerMeta {
  playerName?: string;
}
