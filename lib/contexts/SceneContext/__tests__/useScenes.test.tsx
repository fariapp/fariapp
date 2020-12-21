import { act, renderHook } from "@testing-library/react-hooks";
import { ManagerMode } from "../../../components/Manager/Manager";
import { ISavableScene, useScenes } from "../ScenesContext";

describe("useScenes", () => {
  describe("local storage load", () => {
    it("should load info from local storage", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-scenes", JSON.stringify([{ id: "hey" }]));
      // WHEN
      const { result } = renderHook(() => {
        return useScenes({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.scenes).toEqual([{ id: "hey" }]);
    });
    it("should not info from local storage if empty", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-scenes", "");
      // WHEN
      const { result } = renderHook(() => {
        return useScenes({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.scenes).toEqual([]);
    });
    it("should not info from local storage if empty", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();
      localStorage.setItem("fari-scenes", "][");
      // WHEN
      const { result } = renderHook(() => {
        return useScenes({ localStorage: localStorage as any });
      });

      // THEN
      expect(result.current.state.scenes).toEqual([]);
    });
  });
  describe("flow", () => {
    it("should be able to manager scenes", () => {
      // GIVEN
      const localStorage = new LocalStorageMock();

      const { result } = renderHook(() => {
        return useScenes({ localStorage: localStorage as any });
      });
      // WHEN I add a new scene
      let newScene: ISavableScene | undefined = undefined;
      act(() => {
        newScene = result.current.actions.add();
      });
      // THEN the scene is added
      expect(result.current.state.scenes).toEqual([
        {
          aspects: {},
          id: newScene!.id,
          lastUpdated: newScene!.lastUpdated,
          name: "Scene Name",
          version: 1,
        },
      ]);
      expect(localStorage.getItem("fari-scenes")).toEqual(
        `[{"id":"${
          newScene!.id
        }","name":"Scene Name","aspects":{},"version":1,"lastUpdated":${
          newScene!.lastUpdated
        }}]`
      );
      act(() => {
        // WHEN I update my scene
        newScene = result.current.actions.upsert({
          ...newScene,
          name: "UPDATED NAME",
        } as any);
      });
      // THEN the scene is updated

      expect(result.current.state.scenes).toEqual([
        {
          aspects: {},
          id: newScene!.id,
          lastUpdated: newScene!.lastUpdated,
          name: "UPDATED NAME",
          version: 1,
        },
      ]);
      expect(localStorage.getItem("fari-scenes")).toEqual(
        `[{"id":"${
          newScene!.id
        }","name":"UPDATED NAME","aspects":{},"version":1,"lastUpdated":${
          newScene!.lastUpdated
        }}]`
      );

      let playingScene: ISavableScene | undefined = undefined;
      act(() => {
        // WHEN I save a scene I'm already playing
        playingScene = result.current.actions.upsert({
          id: "an id from a live session",
        } as any);
      });
      // THEN the new scene has been added and is properly sorted
      expect(result.current.state.scenes).toEqual([
        {
          aspects: undefined,
          id: "an id from a live session",
          lastUpdated: expect.anything(),
          name: undefined,
          version: undefined,
        },
        {
          aspects: {},
          id: newScene!.id,
          lastUpdated: newScene!.lastUpdated,
          name: "UPDATED NAME",
          version: 1,
        },
      ]);
      expect(localStorage.getItem("fari-scenes")).toEqual(
        `[{"id":"an id from a live session","lastUpdated":${
          playingScene!.lastUpdated
        }},{"id":"${
          newScene!.id
        }","name":"UPDATED NAME","aspects":{},"version":1,"lastUpdated":${
          newScene!.lastUpdated
        }}]`
      );
      act(() => {
        // WHEN I remove a scene
        result.current.actions.remove("an id from a live session");
      });
      // THEN the scene is deleted
      expect(result.current.state.scenes).toEqual([
        {
          aspects: {},
          id: newScene!.id,
          lastUpdated: newScene!.lastUpdated,
          name: "UPDATED NAME",
          version: 1,
        },
      ]);
      expect(localStorage.getItem("fari-scenes")).toEqual(
        `[{"id":"${
          newScene!.id
        }","name":"UPDATED NAME","aspects":{},"version":1,"lastUpdated":${
          newScene!.lastUpdated
        }}]`
      );
      act(() => {
        // WHEN I add an undefined scene
        result.current.actions.upsert(undefined as any);
      });
      // THEN nothing happens
      expect(result.current.state.scenes).toEqual([
        {
          aspects: {},
          id: newScene!.id,
          lastUpdated: newScene!.lastUpdated,
          name: "UPDATED NAME",
          version: 1,
        },
      ]);
      expect(localStorage.getItem("fari-scenes")).toEqual(
        `[{"id":"${
          newScene!.id
        }","name":"UPDATED NAME","aspects":{},"version":1,"lastUpdated":${
          newScene!.lastUpdated
        }}]`
      );
      act(() => {
        // WHEN I open the manager
        result.current.actions.openManager(ManagerMode.Use);
      });
      // THEN the manager is opened
      expect(result.current.state.mode).toEqual(ManagerMode.Use);
      act(() => {
        // WHEN I close the manager
        result.current.actions.closeManager();
      });
      // THEN the manager is closed
      expect(result.current.state.mode).toEqual(ManagerMode.Close);
    });
  });
});

class LocalStorageMock {
  private store: Record<string, string>;
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = value.toString();
  }

  removeItem(key: string) {
    delete this.store[key];
  }
}
