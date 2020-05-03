import Tensor from './tensor';
import Vector from '../vector';

/**
 * Grid or Radial field to be combined with others to create the tensor field
 */
export abstract class BasisField {
    abstract readonly FOLDER_NAME: string;
    protected static folderNameIndex: number = 0;
    protected parentFolder: dat.GUI;
    protected folder: dat.GUI;
    protected _centre: Vector;

    constructor(centre: Vector, protected _size: number, protected _decay: number) {
        this._centre = centre.clone();
    }

    set centre(centre: Vector) {
        this._centre.copy(centre);
    }

    get centre(): Vector {
        return this._centre.clone();
    }

    set decay(decay: number) {
        this._decay = decay;
    }

    set size(size: number) {
        this._size = size;
    }

    dragStartListener(): void {
        this.setFolder();
    }

    dragMoveListener(delta: Vector): void {
        // Delta assumed to be in world space (only relevant when zoomed)
        this._centre.add(delta);
    }

    abstract getTensor(point: Vector): Tensor;

    getWeightedTensor(point: Vector): Tensor {
        return this.getTensor(point).scale(this.getTensorWeight(point));
    }

    setFolder(): void {
        if (this.parentFolder.__folders) {
            for (const folderName in this.parentFolder.__folders) {
                this.parentFolder.__folders[folderName].close();
            }
            this.folder.open();
        }
    }

    removeFolderFromParent(): void {
        if (this.parentFolder.__folders && Object.values(this.parentFolder.__folders).indexOf(this.folder) >= 0) {
            this.parentFolder.removeFolder(this.folder);
        }
    }

    /**
     * Creates a folder and adds it to the GUI to control params
     */
    setGui(parent: dat.GUI, folder: dat.GUI): void {
        this.parentFolder = parent;
        this.folder = folder;
        folder.add(this._centre, 'x');
        folder.add(this._centre, 'y');
        folder.add(this, '_size');
        folder.add(this, '_decay', -50, 50);
    }

    /**
     * Interpolates between (0 and 1)^decay
     */
    protected getTensorWeight(point: Vector): number {
        const normDistanceToCentre = point.clone().sub(this._centre).length() / this._size;
        return normDistanceToCentre ** -this._decay;
    }
}

export class Grid extends BasisField {
    readonly FOLDER_NAME = `Grid ${Grid.folderNameIndex++}`;

    constructor(centre: Vector, size: number, decay: number, private _theta: number) {
        super(centre, size, decay);
    }

    set theta(theta: number) {
        this._theta = theta;
    }

    setGui(parent: dat.GUI, folder: dat.GUI): void {
        super.setGui(parent, folder);

        // GUI in degrees, convert to rads
        const thetaProp = {theta: this._theta * 180 / Math.PI};
        const thetaController = folder.add(thetaProp, 'theta', -90, 90);
        thetaController.onChange(theta => this._theta = theta * (Math.PI / 180));
    }

    getTensor(point: Vector): Tensor {
        return Tensor.fromAngle(this._theta);
    }
}

export class Radial extends BasisField {
    readonly FOLDER_NAME = `Radial ${Radial.folderNameIndex++}`;
    constructor(centre: Vector, size: number, decay: number) {
        super(centre, size, decay);
    }

    getTensor(point: Vector): Tensor {
        const t = point.clone().sub(this._centre);
        return Tensor.fromVector(t);
    }
}
