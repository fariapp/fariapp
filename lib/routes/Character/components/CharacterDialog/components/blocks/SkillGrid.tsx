import { css } from "@emotion/css";
import Box from "@material-ui/core/Box";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import Grid, { GridSize } from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";
import React from "react";
import { FateLabel } from "../../../../../../components/FateLabel/FateLabel";
import { ISkillGrid } from "../../../../../../domains/character/types";
import {
  IBlockActionComponentProps,
  IBlockComponentProps,
} from "../../types/IBlockComponentProps";

export interface ISkillGridItem {
  display: boolean;
  checked: boolean;
  name: string;
  description: string;
  connectors: Array<SkillGridConnectorDirection>;
}

export enum SkillGridConnectorDirection {
  RIGHT,
  BOTTOM,
}

export function SkillGrid(props: IBlockComponentProps<ISkillGrid>) {
  // configuration
  const columnCount = props.block.meta.columnCount;
  const boxHeight = props.block.meta.boxHeight;
  //end configuration

  const boxHeightInPixels = `${boxHeight}px`;
  const rightConnectorHeight = `${boxHeight / 10}px`;
  const itemHorizontalWidth = Math.floor(12 / columnCount);
  const itemHorizontalGridSize: GridSize = itemHorizontalWidth as any;

  ensureGridIsFilled();

  const useStyles = makeStyles({
    bottomConnectorContainer: {
      position: "relative",
      height: "20px",
    },
    visibleConnector: {
      background: "lightgray",
    },
    hiddenConnector: {
      border: "1px solid lightgray",
    },
    bottomConnector: {
      width: rightConnectorHeight,
      height: "20px",
      margin: 0,
      position: "absolute",
      left: "50%",
      transform: "translateX(-50%)",
    },
    rightConnectorContainer: {
      position: "relative",
    },
    rightConnector: {
      margin: 0,
      height: rightConnectorHeight,
      width: "30px",
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
    },
    itemContainer: {
      height: boxHeightInPixels,
    },
    box: {
      background: "lightgray",
      overflow: "hidden",
      position: "relative",
    },
    hiddenItem: {
      background: "#EFEFEF",
      height: boxHeightInPixels,
      overflow: "hidden",
      position: "relative",
    },
    bottomRightCheckbox: {
      position: "absolute",
      right: 0,
      bottom: 0,
      padding: 0,
    },
    topRightIcon: {
      position: "absolute",
      right: 0,
      top: 0,
      padding: 0,

      // to keep the icon clickable in its absolute position
      zIndex: 1,
    },
    outer: {
      display: "table",
      position: "absolute",
      top: 0,
      left: 0,
      height: "100%",
      width: "100%",
    },

    middle: {
      display: "table-cell",
      verticalAlign: "middle",
    },

    inner: {
      marginLeft: "auto",
      marginRight: "auto",
    },
  });

  const classes = useStyles();

  function ensureGridIsFilled() {
    const rowCount = resolveRowCount();
    const cellCountDelta = resolveCellDelta(columnCount, rowCount);

    if (cellCountDelta !== 0) {
      handleCellDelta(cellCountDelta);
    }
  }

  function resolveCellDelta(columnCount: number, rowCount: number) {
    const allItemsCount = props.block.meta.items.length;
    const gridCellCount = columnCount * rowCount;
    const cellCountDelta = gridCellCount - allItemsCount;

    return cellCountDelta;
  }

  function handleCellDelta(cellCountDelta: number) {
    const missingItemsCount = cellCountDelta > 0 ? cellCountDelta : 0;
    const surplusItemsCount = cellCountDelta < 0 ? -cellCountDelta : 0;

    if (missingItemsCount > 0) {
      const emptyItemsToAppend = buildEmptyItems(cellCountDelta);

      props.onMetaChange({
        ...props.block.meta,
        items: [...props.block.meta.items, ...emptyItemsToAppend],
      });
    } else if (surplusItemsCount > 0) {
      const trimmedItems = [...props.block.meta.items];
      trimmedItems.splice(trimmedItems.length, surplusItemsCount);

      props.onMetaChange({
        ...props.block.meta,
        items: trimmedItems,
      });
    }
  }

  function resolveRowCount() {
    const realItems = getRealItems(props.block.meta.items);

    const realItemsCount = realItems.length;
    const rowCount = Math.ceil(realItemsCount / columnCount);
    return rowCount;
  }

  function buildEmptyItems(numberOfItemsToBuild: number) {
    const items = new Array<ISkillGridItem>();

    for (let i = 0; i < numberOfItemsToBuild; i++) {
      items.push({
        display: false,
        checked: false,
        name: "",
        description: "",
        connectors: new Array<SkillGridConnectorDirection>(),
      });
    }

    return items;
  }

  function getRealItems(allItems: ISkillGridItem[]) {
    const realItems = [...allItems];

    // we specifically need to only take the empty items that are at the end of the array: having empty items in the middle of the grid could be legit
    for (let index = allItems.length - 1; index >= 0; index--) {
      const item = allItems[index];

      const isEmptyItem = !item.display && !item.name && !item.description;
      if (isEmptyItem) {
        realItems.splice(index, 1);
      } else {
        return realItems;
      }
    }

    return realItems;
  }

  function getIsPositionValid(
    direction: SkillGridConnectorDirection,
    item: ISkillGridItem,
    index: number
  ) {
    if (!item.display) {
      return false;
    }

    if (direction === SkillGridConnectorDirection.BOTTOM) {
      const itemBelow = props.block.meta.items[index + columnCount];
      return itemBelow && itemBelow.display;
    }

    if (direction === SkillGridConnectorDirection.RIGHT) {
      const isCurrentItemLastInRow = (index + 1) % columnCount === 0;
      if (isCurrentItemLastInRow) return false;

      const itemOnTheRight = props.block.meta.items[index + 1];
      return itemOnTheRight && itemOnTheRight.display;
    }
  }

  function shouldDisplayConnector(
    direction: SkillGridConnectorDirection,
    item: ISkillGridItem,
    index: number
  ) {
    const isPositionValid = getIsPositionValid(direction, item, index);
    const isConnectorVisible = item.connectors.some(
      (connector) => connector === direction
    );

    const returnValue = {
      isPositionValid: isPositionValid,
      isConnectorVisible: isConnectorVisible,
    };

    return returnValue;
  }

  function handleConnectorClick(
    item: ISkillGridItem,
    index: number,
    connectorDirection: SkillGridConnectorDirection
  ) {
    const bottomConnectorIndex = item.connectors.findIndex(
      (connector) => connector === connectorDirection
    );
    const newConnectors = [...item.connectors];
    if (bottomConnectorIndex >= 0) {
      newConnectors.splice(bottomConnectorIndex, 1);
    } else {
      newConnectors.push(connectorDirection);
    }
    const newItem = {
      ...item,
      connectors: newConnectors,
    };
    const newItems = [...props.block.meta.items];
    newItems[index] = newItem;

    props.onMetaChange({
      ...props.block.meta,
      items: newItems,
    });
  }

  // The MUI Grid is not made to handle 5 columns. If we do need 5 columns,
  // we make sure the first and last columns take more space to fill out the 12 slots MUI gives us per row
  function resolveItemWidth(index: number) {
    if (columnCount !== 5) return itemHorizontalGridSize;

    const isLastColumn = index % columnCount === 0;
    const isFirstColumn = index % columnCount === 4;
    if (isFirstColumn || isLastColumn) return 3 as GridSize;

    return itemHorizontalGridSize;
  }

  return (
    <>
      <Box className={css({ padding: "1em" })}>
        <Grid container>{renderColumnCountEditor()}</Grid>
      </Box>
      <Box>
        <Grid container justify="space-between">
          {props.block.meta.items.map((item, index) => {
            return (
              <Grid item xs={resolveItemWidth(index)} key={index}>
                <Grid container>
                  <Grid item xs={11}>
                    {renderItem(item, index)}
                  </Grid>

                  <Grid item xs={1} className={classes.rightConnectorContainer}>
                    {renderRightConnector(item, index)}
                  </Grid>

                  <>
                    <Grid
                      item
                      xs={11}
                      className={classes.bottomConnectorContainer}
                    >
                      {renderBottomConnector(item, index)}
                    </Grid>
                    <Grid item xs={1} />
                  </>
                </Grid>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </>
  );

  function renderRightConnector(item: ISkillGridItem, index: number) {
    const { isPositionValid, isConnectorVisible } = shouldDisplayConnector(
      SkillGridConnectorDirection.RIGHT,
      item,
      index
    );

    return (
      <>
        {isPositionValid && (props.advanced || isConnectorVisible) && (
          <Box
            className={clsx(
              classes.rightConnector,
              isConnectorVisible
                ? classes.visibleConnector
                : classes.hiddenConnector
            )}
          >
            {props.advanced && (
              <Button
                onClick={() => {
                  handleConnectorClick(
                    item,
                    index,
                    SkillGridConnectorDirection.RIGHT
                  );
                }}
              />
            )}
          </Box>
        )}
      </>
    );
  }

  function renderBottomConnector(item: ISkillGridItem, index: number) {
    const { isPositionValid, isConnectorVisible } = shouldDisplayConnector(
      SkillGridConnectorDirection.BOTTOM,
      item,
      index
    );

    return (
      <>
        {isPositionValid && (props.advanced || isConnectorVisible) && (
          <Box
            className={clsx(
              classes.bottomConnector,
              isConnectorVisible
                ? classes.visibleConnector
                : classes.hiddenConnector
            )}
          >
            {props.advanced && (
              <Button
                onClick={() => {
                  handleConnectorClick(
                    item,
                    index,
                    SkillGridConnectorDirection.BOTTOM
                  );
                }}
              />
            )}
          </Box>
        )}
      </>
    );
  }

  function renderColumnCountEditor() {
    return (
      <>
        <Grid item xs={10}>
          <FateLabel variant="body2" color="primary">
            <b>Number of columns:</b>
          </FateLabel>
        </Grid>
        <Grid item xs={2}>
          <TextField
            type="number"
            InputProps={{ inputProps: { min: 2, max: 6 } }}
            value={props.block.meta.columnCount}
            onChange={(e) => {
              let columnCount = 3;
              if (e.target.value) {
                const parsed = parseInt(e.target.value);
                if (parsed > 6) {
                  columnCount = 6;
                } else {
                  columnCount = parsed;
                }
              }

              props.onMetaChange({
                ...props.block.meta,
                columnCount: columnCount,
              });
            }}
          />
        </Grid>
      </>
    );
  }

  function renderItem(item: ISkillGridItem, index: number) {
    return (
      <>
        {/* <Box className={classes.itemContainer}> */}
        {!item.display && props.advanced && (
          <Box className={clsx(classes.hiddenItem, classes.itemContainer)}>
            <IconButton
              size="small"
              className={classes.topRightIcon}
              onClick={() => {
                const newItem = { ...item, display: true };
                const newItems = [...props.block.meta.items];
                newItems[index] = newItem;

                props.onMetaChange({
                  ...props.block.meta,
                  items: newItems,
                });
              }}
            >
              <VisibilityIcon />
            </IconButton>
          </Box>
        )}

        {item.display && (
          <Box className={clsx(classes.box, classes.itemContainer)}>
            <Checkbox
              className={classes.bottomRightCheckbox}
              checked={item.checked}
              onChange={() => {
                const newItem = { ...item, checked: !item.checked };
                const newItems = [...props.block.meta.items];
                newItems[index] = newItem;

                props.onMetaChange({
                  ...props.block.meta,
                  items: newItems,
                });
              }}
            />

            {props.advanced && (
              <IconButton
                size="small"
                className={classes.topRightIcon}
                onClick={() => {
                  const newItem = { ...item, display: false };
                  const newItems = [...props.block.meta.items];
                  newItems[index] = newItem;

                  props.onMetaChange({
                    ...props.block.meta,
                    items: newItems,
                  });
                }}
              >
                <VisibilityOffIcon />
              </IconButton>
            )}

            {/* if there is no description, the tile will be put in the center of the tile */}
            {item.description && renderGridItemTitle(item)}

            <Box className={classes.outer}>
              <Box className={classes.middle}>
                <Box className={classes.inner}>
                  {item.description
                    ? renderGridItemDescription(item)
                    : renderGridItemTitle(item)}
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </>
    );
  }

  function renderGridItemDescription(item: ISkillGridItem): React.ReactNode {
    return (
      <Typography
        variant="body2"
        align="center"
        style={{
          margin: "0em .5em",
        }}
      >
        {item.description}
      </Typography>
    );
  }

  function renderGridItemTitle(item: ISkillGridItem) {
    return (
      <Typography
        align="center"
        style={{
          margin: ".5em",
          fontSize: "1em",
          fontWeight: "bold",
          textTransform: "uppercase",
        }}
      >
        {item.name}
      </Typography>
    );
  }
}
SkillGrid.displayName = "SkillGrid";

export function SkillGridActions(
  props: IBlockActionComponentProps<ISkillGrid>
) {
  return <></>;
}
SkillGridActions.displayName = "SkillGridActions";
