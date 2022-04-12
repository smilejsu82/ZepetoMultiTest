using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DrawGizmo : MonoBehaviour
{
    private Vector3 center;
    public bool show = false;
    void OnDrawGizmos()
    {
        if (show)
        {
            this.center = this.GetComponent<CharacterController>().bounds.center;
            Gizmos.color = Color.yellow;
            Gizmos.DrawWireSphere(this.center, 3);
        }

    }
}
